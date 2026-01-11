// src/main.ts
import { createBrowser } from "./src/browser.ts";
import { login } from "./src/login.ts";
import { getBalance } from "./src/balance.ts";
import { buyLotto645 } from "./src/lotto645.ts";
import { sendDiscord } from "./src/notify.ts";

async function main() {
  console.log("🎰 Lotto Auto Purchase (Deno Integrated)");
  console.log("========================================");

  const browser = await createBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await login(page);
    await new Promise(r => setTimeout(r, 1000));

    console.log("💰 Checking balance...");
    const balance = await getBalance(page);
    console.log(`   - 예치금: ${balance.deposit_balance.toLocaleString()}원`);
    console.log(`   - 구매가능: ${balance.available_amount.toLocaleString()}원`);

    const minRequired = 10000;
    if (balance.available_amount < minRequired) {
      console.log(`💳 Balance low. Charging needed...`);

      // await chargeDeposit(page, 10000);
      await sendDiscord(
        `⛔ **구매 중단 알림 (잔액 부족)**\n` +
        `예치금이 부족하여 구매를 진행하지 않고 종료합니다.\n\n` +
        `💰 현재 잔액: **${balance.available_amount.toLocaleString()}원**\n` +
        `📉 기준 금액: ${minRequired.toLocaleString()}원`
      );

      // 잔액 부족으로 종료
      return;
    }

    console.log("🎫 Buying Lotto 645...");
    const result645 = await buyLotto645(page);
    await sendDiscord(
      `✅ 로또 6/45 구매 완료! (${result645.result})`,
      result645.screenshotPath
    );

    console.log("\n✅ All tasks completed successfully!");

  } catch (error) {
    console.error("\n❌ Critical Error:", error);
    await sendDiscord(`❌ **오류 발생:** ${error}`);
  } finally {
    console.log("🔒 Closing browser session...");
    await context.close();
    await browser.close();
  }
}

if (import.meta.main) {
  main();
}
