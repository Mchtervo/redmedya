/**
 * Admin: Telegram botunu kurar ve siteye bağlar.
 *
 * POST { token }  → bot anahtarını doğrular, sohbet kimliğini (bota /start yazan kişi) bulur,
 *                   DATA_DIR/telegram.env'e kaydeder, komutları bağlar (setWebhook), test mesajı atar.
 * POST {}         → kayıtlı bot ile yalnızca bağlar + test mesajı.
 */
import { readFile, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { siteConfig } from "@/config/site";
import { getTelegramWebhookSecret } from "@/lib/ai-couples/auth";
import { dataPath, reloadPersistentEnv } from "@/lib/data-dir";
import { sendTelegramMessage } from "@/lib/lead-notify";

export const dynamic = "force-dynamic";

const TOKEN_RE = /^\d{5,15}:[A-Za-z0-9_-]{30,60}$/;

type TgResponse<T> = { ok?: boolean; description?: string; result?: T };

async function tg<T>(token: string, method: string, body?: object): Promise<TgResponse<T> | null> {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  return ((await res?.json().catch(() => null)) as TgResponse<T> | null) ?? null;
}

/** telegram.env içindeki diğer satırları koruyarak anahtarları günceller. */
async function saveTelegramEnv(values: Record<string, string>) {
  const file = dataPath("telegram.env");
  let lines: string[] = [];
  try {
    lines = (await readFile(file, "utf-8")).split(/\r?\n/).filter((l) => l.trim());
  } catch {
    /* ilk kurulum */
  }
  for (const [key, val] of Object.entries(values)) {
    lines = lines.filter((l) => !l.trim().startsWith(`${key}=`));
    lines.push(`${key}=${val}`);
    process.env[key] = val;
  }
  await writeFile(file, `${lines.join("\n")}\n`, { encoding: "utf-8", mode: 0o600 });
}

async function connectWebhook(token: string) {
  const data = await tg<boolean>(token, "setWebhook", {
    url: `${siteConfig.url}/api/telegram/webhook`,
    secret_token: getTelegramWebhookSecret(),
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  return data?.ok ? null : (data?.description ?? "Telegram'a ulaşılamadı");
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  reloadPersistentEnv();

  const body = (await request.json().catch(() => ({}))) as { token?: string };
  const newToken = body.token?.trim();

  if (newToken) {
    if (!TOKEN_RE.test(newToken)) {
      return NextResponse.json({ ok: false, error: "Bu bir bot anahtarına benzemiyor (örnek: 123456789:AA…)" }, { status: 400 });
    }
    const me = await tg<{ username?: string }>(newToken, "getMe");
    if (!me?.ok) return NextResponse.json({ ok: false, error: "Bot anahtarı geçersiz" }, { status: 400 });
    const bot = me.result?.username ? `@${me.result.username}` : "bot";

    // Sohbet kimliği: bota en son yazan özel sohbet (webhook açıkken getUpdates çalışmaz).
    await tg(newToken, "deleteWebhook", { drop_pending_updates: false });
    const updates = await tg<Array<{ message?: { chat?: { id?: number; type?: string } } }>>(newToken, "getUpdates", {
      allowed_updates: ["message", "callback_query"],
    });
    const chat = [...(updates?.result ?? [])].reverse().find((u) => u.message?.chat?.type === "private")?.message?.chat;

    await saveTelegramEnv({ TELEGRAM_BOT_TOKEN: newToken });
    if (!chat?.id) {
      return NextResponse.json({
        ok: false,
        needStart: true,
        bot,
        error: `Bot kaydedildi. Şimdi Telegram'da ${bot} botunu açıp /start yaz, sonra butona tekrar bas.`,
      });
    }
    await saveTelegramEnv({ TELEGRAM_CHAT_ID: String(chat.id) });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token || !process.env.TELEGRAM_CHAT_ID?.trim()) {
    return NextResponse.json({ ok: false, error: "Önce bot anahtarını girin" }, { status: 400 });
  }
  const err = await connectWebhook(token);
  if (err) return NextResponse.json({ ok: false, error: err }, { status: 502 });
  await sendTelegramMessage("✅ RED MEDIA asistanı bağlandı. Komutlar için /yardim yaz.");
  return NextResponse.json({ ok: true });
}
