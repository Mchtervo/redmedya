/** Admin: Telegram botunun komutlarını siteye bağlar (setWebhook) ve test mesajı atar. */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { siteConfig } from "@/config/site";
import { getTelegramWebhookSecret } from "@/lib/ai-couples/auth";
import { reloadPersistentEnv } from "@/lib/data-dir";
import { sendTelegramMessage } from "@/lib/lead-notify";

export const dynamic = "force-dynamic";

export async function POST() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  reloadPersistentEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || !process.env.TELEGRAM_CHAT_ID?.trim()) {
    return NextResponse.json({ ok: false, error: "Telegram bot token / chat id ayarlı değil" }, { status: 400 });
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url: `${siteConfig.url}/api/telegram/webhook`,
      secret_token: getTelegramWebhookSecret(),
      allowed_updates: ["message"],
      drop_pending_updates: true,
    }),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  const data = (await res?.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
  if (!data?.ok) {
    return NextResponse.json({ ok: false, error: data?.description ?? "Telegram'a ulaşılamadı" }, { status: 502 });
  }
  await sendTelegramMessage("✅ RED MEDIA asistanı bağlandı. Komutlar için /yardim yaz.");
  return NextResponse.json({ ok: true });
}
