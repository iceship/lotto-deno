// src/lotto645.ts
import { ensureDir } from "@std/fs/ensure-dir";
import { Page } from "playwright-core";
import { createBrowser } from "./browser.ts";
import { login } from "./login.ts";

export interface LottoResult {
  result: string;
  screenshotPath: string;
}

export async function buyLotto645(page: Page): Promise<LottoResult> {
  console.log('🚀 Navigating to Lotto 6/45 page...');
  await page.goto("https://ol.dhlottery.co.kr/olotto/game/game645.do");
  await page.waitForSelector("#num2", { state: "visible", timeout: 10000 });

  if (await page.locator("#popupLayerAlert").isVisible()) {
    await page.locator("#popupLayerAlert").getByRole("button", { name: "확인" }).click();
  }

  const autoGames = 5;
  if (autoGames > 0) {
    await page.click("#num2");
    await page.selectOption("#amoundApply", String(autoGames));
    await page.click("#btnSelectNum");
    console.log(`✅ Automatic game(s) added: ${autoGames}`);

    const dirName = "screenshots";
    await ensureDir(dirName);

    const fileName = `verify_645_${new Date().toISOString().split('T')[0]}.png`;
    const screenshotPath = `${dirName}/${fileName}`;

    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`✅ Screenshot saved: ${screenshotPath}`);

    // 실제 구매 버튼 (나중에 주석 해제)
    // await page.click("#btnBuy");

    return {
      result: `자동 게임 ${autoGames}개 추가됨`,
      screenshotPath: screenshotPath
    };
  }

  return {
    result: "No games were added.",
    screenshotPath: ""
  }
}

async function run() {
  const browser = await createBrowser();
  const context = await browser.newContext();
  const page = await context.newPage();
  try {
    await login(page);
    const result = await buyLotto645(page);
    console.log("Result:", result);
  } finally {
    await browser.close();
  }
}

if (import.meta.main) run();
