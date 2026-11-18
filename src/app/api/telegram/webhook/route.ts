/**
 * Telegram bot komutları (yalnızca TELEGRAM_CHAT_ID sohbetinden kabul edilir).
 * /rapor · /sicak · /ilik · /soguk · /karaliste · /sira · /kontenjan · /bul <isim|tel> · /yardim
 * Düz yazı = /bul. Sesli mesaj: n8n yazıya çevirip { "text": "..." } ile aynı uca gönderebilir (Adım 4).
 */
import { NextResponse } from "next/server";
import { reloadPersistentEnv } from "@/lib/data-dir";
import { verifyAiApiRequest, verifyTelegramSecret } from "@/lib/ai-couples/auth";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { answerCommand } from "@/lib/ai-couples/telegram-commands";

export const dynamic = "force-dynamic";

type TgUpdate = {
  message?: { chat?: { id?: number | string }; text?: string; voice?: unknown };
};

export async function POST(request: Request) {
  // 1) n8n (sesli komut yazıya çevrilmiş): Bearer AI anahtarı + { text }
  if (verifyAiApiRequest(request)) {
    const body = (await request.json().catch(() => null)) as { text?: string; send?: boolean } | null;
    if (!body?.text) return NextResponse.json({ ok: false, error: "text zorunlu" }, { status: 400 });
    const reply = await answerCommand(body.text);
    if (body.send !== false) await sendTelegramMessage(reply);
    return NextResponse.json({ ok: true, reply });
  }

  // 2) Telegram'ın kendisi: gizli başlık + doğru sohbet
  if (!verifyTelegramSecret(request)) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  reloadPersistentEnv();
  const allowedChat = process.env.TELEGRAM_CHAT_ID?.trim();
  const update = (await request.json().catch(() => null)) as TgUpdate | null;
  const chatId = update?.message?.chat?.id;
  // Telegram'a her zaman 200 dön (aksi halde aynı güncellemeyi tekrar yollar).
  if (!allowedChat || String(chatId) !== allowedChat) return NextResponse.json({ ok: true });

  if (update?.message?.voice) {
    await sendTelegramMessage("🎙️ Sesli komut henüz bağlı değil (Adım 4'te n8n ile eklenecek). Şimdilik yazarak sorabilirsin: /yardim");
    return NextResponse.json({ ok: true });
  }
  const text = update?.message?.text;
  if (text) {
    try {
      await sendTelegramMessage(await answerCommand(text));
    } catch {
      await sendTelegramMessage("⚠️ Komut işlenemedi.");
    }
  }
  return NextResponse.json({ ok: true });
}
