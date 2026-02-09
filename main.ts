// src/main.ts
import { createBrowser } from "./src/browser.ts";
import { login } from "./src/login.ts";
import { getBalance } from "./src/balance.ts";
import { buyLotto645 } from "./src/lotto645.ts";
import { sendDiscord } from "./src/notify.ts";
import { handleFatalError } from "./src/error-handler.ts";
import { env } from "./src/env.ts";

const GAME_COUNT = env.AUTO_GAMES;
const PRICE_PER_GAME = 1000;
const REQUIRED_MONEY = GAME_COUNT * PRICE_PER_GAME;

async function main() {
  console.log("🎰 Lotto Auto Purchase (Deno Integrated)");

  const browser = await createBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // 1. 로그인
    await login(page);

    // 2. [구매 전] 잔액 확인 (Pre-check)
    console.log("💰 Checking balance before purchase...");
    const initialBalance = await getBalance(page);

    const currentMoney = initialBalance.available_amount;
    console.log(`💵 Current Funds: ${currentMoney.toLocaleString()} KRW`);

    // 3. 예치금 부족 시 중단 알림
    if (currentMoney < REQUIRED_MONEY) {
      const errorMsg = `❌ **구매 실패: 예치금 부족**\n` +
        `💰 현재 잔액: ${currentMoney.toLocaleString()}원\n` +
        `🎫 필요 금액: ${REQUIRED_MONEY.toLocaleString()}원`;

      console.error("⚠️ Insufficient funds. Skipping purchase.");
      await sendDiscord(errorMsg);
      return; // 여기서 프로그램 종료
    }

    // 4. 로또 구매 실행
    // (충분한 잔액이 확인되었으므로 안전하게 진입)
    const result = await buyLotto645(page, GAME_COUNT);

    // 5. [구매 후] 최종 잔액 확인 (Post-check)
    // 구매가 성공했다면 잔액이 줄어들었을 테니 다시 확인합니다.
    console.log("💰 Checking final balance...");
    const finalBalance = await getBalance(page);
    console.log(
      `💵 Final Funds: ${finalBalance.available_amount.toLocaleString()} KRW`,
    );

    // 6. 결과 디스코드 전송 (성공 알림)
    if (result) {
      const message = `✅ **로또 6/45 구매 완료!**\n` +
        `🎫 **수량:** 자동 ${result.count}게임 (₩${
          (result.count * 1000).toLocaleString()
        })\n` +
        `📉 **구매 후 잔액:** ${finalBalance.available_amount.toLocaleString()}원\n` +
        `🍀 행운을 빕니다!`;

      await sendDiscord(message, result.screenshotPath);
    }
  } catch (error) {
    // 에러 발생 시 (로그인 실패, 구매 중 에러 등)
    console.error("\n❌ Error caught in main:", error);
    try {
      await handleFatalError(page, error);
    } catch (handlerError) {
      console.error("❌ Error handler itself failed:", handlerError);
    }
  } finally {
    console.log("🔒 Closing browser session...");
    try {
      if (!page.isClosed()) {
        console.log("  ├─ Closing page...");
        await page.close();
      }
    } catch (e) {
      console.warn("  ├─ Page close warning:", e);
    }

    try {
      console.log("  ├─ Closing context...");
      await context.close();
    } catch (e) {
      console.warn("  ├─ Context close warning:", e);
    }

    try {
      console.log("  ├─ Closing browser...");
      await browser.close();
    } catch (e) {
      console.warn("  ├─ Browser close warning:", e);
    }

    console.log("✅ Browser session closed.");
  }
}

if (import.meta.main) {
  main();
}
