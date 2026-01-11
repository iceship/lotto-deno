// src/env.ts
import { load } from "@std/dotenv";
import { z } from "zod";

await load({ export: true });

const envSchema = z.object({
  USER_ID: z.string().min(1, "USER_ID is required"),
  PASSWD: z.string().min(1, "PASSWD is required"),
  BROWSERLESS_WS_ENDPOINT: z.url(),
  BROWSERLESS_TOKEN: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.url().optional(),
});

const parsed = envSchema.safeParse(Deno.env.toObject());

if (!parsed.success) {
  const pretty = z.prettifyError(parsed.error);
  console.error("❌ Invalid environment variables:", pretty);
  throw new Error("Invalid environment variables.");
}

console.error("✅ Environment variables loaded and validated successfully.");

export const env = Object.freeze({
  ...parsed.data,
});
