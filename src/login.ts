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
  await page.goto("https://www.dhlottery.co.kr/login");

  // 아이디/비번 입력
  await page.fill("#inpUserId", USER_ID);
  await page.fill("#inpUserPswdEncn", PASSWD);

  // 로그인 버튼 클릭
  await page.click("#btnLogin");

  await page.waitForLoadState("networkidle");
  console.log('✅ Logged in successfully');
}
