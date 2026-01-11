// src/error-handler.ts
import { Page } from "playwright-core";
import { ensureDir } from "@std/fs/ensure-dir";
import { sendDiscord } from "./notify.ts";

/**
 * 에러 발생 시 스크린샷을 찍고 디스코드로 알림을 보냅니다.
 * 브라우저가 닫혀있어서 스크린샷을 못 찍는 경우에도 에러 메시지는 보냅니다.
 */
export async function handleFatalError(page: Page, error: unknown) {
  console.error("🔥 Handling Fatal Error...");

  const errorMessage = error instanceof Error ? error.message : String(error);
  let screenshotPath: string | undefined = undefined;

  // 1. 스크린샷 시도 (브라우저가 살아있을 때만)
  try {
    if (!page.isClosed()) {
      const dirName = "screenshots";
      await ensureDir(dirName);

      const fileName = `error_${new Date().toISOString().replace(/[:.]/g, "-")}.png`;
      screenshotPath = `${dirName}/${fileName}`;

      console.log("📸 Attempting to capture error screenshot...");
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`✅ Error screenshot saved: ${screenshotPath}`);
    } else {
      console.warn("⚠️ Browser page is already closed. Cannot take screenshot.");
    }
  } catch (snapError) {
    console.error("❌ Failed to take error screenshot:", snapError);
  }

  // 2. 디스코드 알림 발송
  const discordMessage = `❌ **오류 발생 (Critical Error)**\n` +
    `📄 페이지: ${page.isClosed() ? 'Closed' : page.url()}\n` +
    `💬 내용: \`\`\`${errorMessage}\`\`\``;

  await sendDiscord(discordMessage, screenshotPath);
}
