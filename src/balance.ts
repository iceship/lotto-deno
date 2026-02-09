import { Page } from "playwright-core";
import { login } from "./login.ts";
import { createBrowser } from "./browser.ts";

// 반환값 타입 정의
interface BalanceInfo {
  deposit_balance: number;
  available_amount: number;
}

/**
 * 마이페이지에서 예치금 잔액과 구매가능 금액을 조회합니다.
 */
export async function getBalance(page: Page): Promise<BalanceInfo> {
  // Navigate to My Page
  console.log("📂 Accessing My Page...");
  await page.goto("https://www.dhlottery.co.kr/mypage/home");
  //await page.waitForLoadState("networkidle");

  console.log("⏳ Waiting for balance element...");
  try {
    await page.waitForSelector("#totalAmt", {
      state: "visible",
      timeout: 15000,
    });
  } catch (e) {
    // 만약 여기서 에러가 나면, 로그인 풀림 등을 의심해볼 수 있음
    console.error(
      "⚠️ Failed to find balance element. Current URL:",
      page.url(),
    );
    throw e;
  }

  // Get deposit balance (예치금 잔액)
  // Selector: #totalAmt
  const depositEl = page.locator("#totalAmt");
  const depositText = await depositEl.innerText();

  // Get available amount (구매가능)
  // Selector: #divCrntEntrsAmt
  const availableEl = page.locator("#divCrntEntrsAmt");
  const availableText = await availableEl.innerText();

  // Parse amounts (remove non-digits using Regex)
  const depositBalance = parseInt(depositText.replace(/[^0-9]/g, ""), 10);
  const availableAmount = parseInt(availableText.replace(/[^0-9]/g, ""), 10);

  return {
    deposit_balance: depositBalance,
    available_amount: availableAmount,
  };
}

async function run() {
  const browser = await createBrowser();

  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 2. 로그인 수행
    await login(page);

    // 안전장치: 로그인 쿠키 안착 대기 (1초)
    await new Promise((r) => setTimeout(r, 1000));

    // 3. 잔액 조회
    const balanceInfo = await getBalance(page);

    // 4. 결과 출력
    console.log(
      `💰 예치금 잔액: ${balanceInfo.deposit_balance.toLocaleString()}원`,
    );
    console.log(
      `🛒 구매가능: ${balanceInfo.available_amount.toLocaleString()}원`,
    );
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    // Cleanup
    await context.close();
    await browser.close();
    console.log("👋 Connection closed.");
  }
}

// 메인 실행 체크
if (import.meta.main) {
  run();
}
