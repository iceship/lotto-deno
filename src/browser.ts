// src/browser.ts
import { Browser, chromium } from "playwright-core";
import { env } from "./env.ts";

/**
 * 환경 설정에 따라 원격(Browserless) 또는 로컬 브라우저 인스턴스를 생성하여 반환합니다.
 */
export async function createBrowser(): Promise<Browser> {
  const wsEndpoint = env.BROWSERLESS_WS_ENDPOINT;
  const token = env.BROWSERLESS_TOKEN;

  if (wsEndpoint) {
    const endpoint = new URL(wsEndpoint);

    if (token) {
      endpoint.searchParams.set("token", token);
    }

    // ⭐️ 공통 옵션 설정 (Stealth, Window Size, User Agent)
    endpoint.searchParams.set("stealth", "true");
    endpoint.searchParams.set("--window-size", "1920,1080");
    endpoint.searchParams.set(
      "--user-agent",
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    );

    console.log(`📡 Connecting over CDP to: ${endpoint.origin}...`);
    return await chromium.connectOverCDP(endpoint.toString());
  } else {
    // 로컬 브라우저 실행 (백업용)
    console.log("🖥️ Launching local browser...");
    return await chromium.launch({ headless: true });
  }
}
