// src/notify.ts
import { env } from "./env.ts";

export async function sendDiscord(message: string, imagePath?: string) {
  const webhookUrl = env.DISCORD_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn("⚠️ Discord Webhook URL not found. Skipping notification.");
    return;
  }

  try {
    const formData = new FormData();

    const payload = {
      content: message,
      embeds: [{
        title: "로또 구매 알림",
        description: message,
        color: 5814783,
      }],
    };

    formData.append("payload_json", JSON.stringify(payload));

    if (imagePath) {
      try {
        const fileBytes = await Deno.readFile(imagePath);
        const blob = new Blob([fileBytes]);
        formData.append("file", blob, imagePath);
      } catch (err) {
        console.error(`❌ Failed to read image file: ${imagePath}`, err);
        formData.append("content", `${message}\n(이미지 전송 실패)`);
      }
    }

    const response = await fetch(webhookUrl, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      console.error(
        `❌ Discord Webhook Error: ${response.status} ${response.statusText}`,
      );
    } else {
      console.log("🔔 Discord notification sent!");
    }
  } catch (error) {
    console.error("❌ Failed to send notification:", error);
  }
}
