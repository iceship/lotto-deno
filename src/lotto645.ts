// src/lotto645.ts
import { ensureDir } from "@std/fs/ensure-dir";
import { Page } from "playwright-core";
import { createBrowser } from "./browser.ts";
import { login } from "./login.ts";

export interface LottoResult {
  count: number;
  screenshotPath: string;
}

export async function buyLotto645(page: Page, gameCount: number): Promise<LottoResult | null> {
  console.log('🚀 Navigating to Lotto 6/45 page...');
  await page.goto("https://ol.dhlottery.co.kr/olotto/game/game645.do");

  // 게임 화면 로딩 대기
  await page.waitForSelector("#num2", { state: "visible", timeout: 10000 });

  // 팝업 제거 함수
  const removePopup = async () => {
    try {
      // 팝업 요소를 제거
      await page.evaluate(() => {
        const ele = (self as any).document.getElementById("ele_pause_layer_pop02");
        if (ele) ele.remove();
      }).catch(() => null);

      await page.evaluate(() => {
        const bg = (self as any).document.querySelector(".pause_bg");
        if (bg) bg.remove();
      }).catch(() => null);

      await page.evaluate(() => {
        const layer = (self as any).document.querySelector(".pause_layer_pop");
        if (layer) layer.remove();
      }).catch(() => null);

      console.log("✨ Popup removed via JavaScript");
    } catch (e) {
      console.log("⚠️ Popup removal warning:", e);
    }
  };

  // 1. 초기 팝업 제거
  await removePopup();
  await page.waitForTimeout(300);

  const autoGames = gameCount; // 구매할 게임 수
  const expectedAmount = autoGames * 1000; // 예상 금액 (1000원)

  if (autoGames > 0) {
    // 1.5 클릭 전 팝업 재확인 (혹시 모르니)
    console.log("🔍 Final popup check before clicking #num2...");
    const pausePopup2 = page.locator("#ele_pause_layer_pop02");
    if (await pausePopup2.isVisible()) {
      console.log("⏸️ Popup still visible, removing via JavaScript...");
      await removePopup();
      await page.waitForTimeout(500);
    }

    // 2. 번호 선택 (자동)
    // 강력한 클릭: force=true를 사용해 팝업 무시
    console.log("🖱️ Clicking #num2 (auto selection)...");
    await page.click("#num2", { force: true, timeout: 5000 });

    console.log("⏳ Waiting for selection menu...");
    await page.waitForTimeout(500);

    await page.selectOption("#amoundApply", String(autoGames)); // 수량선택

    // 버튼 클릭 전 재차 팝업 제거
    console.log("🔍 Final popup check before clicking #btnSelectNum...");
    await removePopup();

    console.log("✅ Confirming selection...");
    await page.click("#btnSelectNum", { force: true }); // 확인 버튼 (force=true 추가)
    console.log(`✅ Automatic game(s) selected: ${autoGames}`);

    // ----------------------------------------------------
    // 3. [NEW] 결제 금액 검증 (Python 코드 로직 이식)
    // ----------------------------------------------------
    console.log("💰 Verifying payment amount...");
    // 금액 텍스트가 업데이트될 때까지 아주 잠깐 대기
    await page.waitForTimeout(500);

    const payAmtEl = page.locator("#payAmt");
    const payText = await payAmtEl.innerText();
    // 숫자만 추출 (예: "5,000원" -> 5000)
    const currentAmount = parseInt(payText.replace(/[^0-9]/g, ""), 10);

    if (currentAmount !== expectedAmount) {
      throw new Error(`❌ Payment mismatch! Expected: ${expectedAmount}, Displayed: ${currentAmount}`);
    }
    console.log(`✅ Amount verified: ${currentAmount} KRW`);


    // ----------------------------------------------------
    // 4. 구매 버튼 클릭
    // ----------------------------------------------------
    console.log("💳 Clicking Buy button...");
    await page.click("#btnBuy");


    // ----------------------------------------------------
    // 5. '구매하시겠습니까?' 확인 팝업 처리
    // ----------------------------------------------------
    console.log("⏳ Waiting for confirm popup...");
    await page.waitForSelector("#popupLayerConfirm", { state: "visible", timeout: 5000 });

    // '확인' 클릭
    await page.click('#popupLayerConfirm input[value="확인"]');
    console.log("✅ Confirmed purchase dialog.");


    // ----------------------------------------------------
    // 6. [NEW] 결과 확인 (한도 초과 vs 성공)
    // ----------------------------------------------------
    console.log("⏳ Analyzing purchase result...");

    // 네트워크 딜레이 등을 고려해 잠시 대기 (Python의 time.sleep(3) 대응)
    // 팝업이 뜨는 시간을 1초 정도 기다려줍니다.
    await page.waitForTimeout(1000);

    // (A) 한도 초과 팝업 감지 (#recommend720Plus)
    const limitPopup = page.locator("#recommend720Plus");
    if (await limitPopup.isVisible()) {
      // 에러 메시지 추출 시도
      const errorMsg = await limitPopup.locator(".cont1").innerText().catch(() => "Weekly Limit Exceeded");
      // 한도 초과 시 에러를 던져서 main.ts가 스크린샷 찍고 종료하게 함
      throw new Error(`❌ Purchase Failed: ${errorMsg.trim().replace(/\n/g, " ")}`);
    }

    // (B) 성공 영수증 대기 (#report)
    try {
      console.log("⏳ Waiting for receipt popup (#report)...");
      await page.waitForSelector("#report", { state: "visible", timeout: 15000 });
    } catch (_e) {
      // 영수증도 안 뜨고 한도 초과도 아니라면, 알 수 없는 에러 팝업(#popupLayerAlert)이 떴을 수 있음
      if (await page.locator("#popupLayerAlert").isVisible()) {
        const alertMsg = await page.locator("#popupLayerAlert .layer-message").innerText();
        throw new Error(`❌ Generic Error Alert: ${alertMsg}`);
      }
      throw new Error("❌ Purchase receipt did not appear (Timeout).");
    }
    // ----------------------------------------------------
    // 7. 성공 스크린샷 저장
    // ----------------------------------------------------
    console.log("📸 Saving final receipt...");
    const dirName = "screenshots";
    await ensureDir(dirName);

    const fileName = `result_645_${new Date().toISOString().split('T')[0]}.png`;
    const screenshotPath = `${dirName}/${fileName}`;

    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Receipt saved: ${screenshotPath}`);

    return {
      count: autoGames,
      screenshotPath: screenshotPath
    };
  }
  return null;
}

async function run() {
  const browser = await createBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await login(page);
    const result = await buyLotto645(page, 5);
    console.log("Result:", result);
  } finally {
    await browser.close();
  }
}

if (import.meta.main) run();
