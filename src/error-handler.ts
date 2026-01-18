// src/error-handler.ts
import { Page } from "playwright-core";
import { ensureDir } from "@std/fs/ensure-dir";
import { sendDiscord } from "./notify.ts";

/**
 * 로그 파일에 에러 정보를 기록합니다.
 */
function logErrorToFile(error: unknown) {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : "No stack trace";

  const logEntry = `\n[${timestamp}] FATAL ERROR\n` +
    `Message: ${errorMessage}\n` +
    `Stack: ${stack}\n` +
    `${'='.repeat(60)}`;

  try {
    // 로그 디렉토리 생성
    Deno.mkdirSync("logs", { recursive: true });

    // 로그 파일에 추가
    const logPath = `logs/error_${new Date().toISOString().split('T')[0]}.log`;
    Deno.writeTextFileSync(logPath, logEntry, { append: true });
    console.log(`📝 Error logged to: ${logPath}`);
  } catch (writeError) {
    console.error("❌ Failed to write error log:", writeError);
  }
}

/**
 * 에러 발생 시 스크린샷을 찍고 디스코드로 알림을 보냅니다.
 * 브라우저가 닫혀있어서 스크린샷을 못 찍는 경우에도 에러 메시지는 보냅니다.
 */
export async function handleFatalError(page: Page, error: unknown) {
  console.error("🔥 Handling Fatal Error...");

  // 0. 에러 로그 파일에 기록
  logErrorToFile(error);

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;
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
  const pageStatus = page.isClosed() ? '❌ Closed' : `✅ ${page.url()}`;
  const discordMessage = `❌ **오류 발생 (Critical Error)**\n` +
    `📄 페이지 상태: ${pageStatus}\n` +
    `💬 에러 메시지:\n\`\`\`${errorMessage}\`\`\`` +
    (errorStack ? `\n\n📋 스택 트레이스:\n\`\`\`${errorStack.split('\n').slice(0, 5).join('\n')}...\`\`\`` : '');

  await sendDiscord(discordMessage, screenshotPath);
}
