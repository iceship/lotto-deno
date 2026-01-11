// src/login.ts
import type { Page } from "playwright-core";
import { env } from "./env.ts";

const USER_ID = env.USER_ID;
const PASSWD = env.PASSWD;

export async function login(page: Page) {
  if (!USER_ID || !PASSWD) {
    throw new Error("❌ USER_ID or PASSWD not found in environment variables.");
  }

  console.log('🔑 Starting login process...');

  page.on('dialog', async dialog => {
    console.warn(`💬 Alert detected on login page: "${dialog.message()}"`);
    await dialog.accept(); // 확인 버튼 누름
  });

  await page.goto("https://www.dhlottery.co.kr/login");

  // 아이디/비번 입력
  await page.fill("#inpUserId", USER_ID);
  await page.fill("#inpUserPswdEncn", PASSWD);

  // 로그인 버튼 클릭
  await page.click("#btnLogin");

  try {
    console.log("⏳ Verifying login status (Checking for ID '#mypageBtn')...");
    await page.waitForSelector("#mypageBtn", {
      state: "attached",
      timeout: 10000
    });

    console.log('✅ Logged in successfully (My Page button found)');
  } catch (_e) {
    console.error(`❌ Login Verification Failed! URL: ${page.url()}`);
    throw new Error("Login failed: '#mypageBtn' with text '마이페이지' not found.");
  }
}
