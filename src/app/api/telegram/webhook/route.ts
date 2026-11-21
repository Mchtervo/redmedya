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
import { transcribeTelegramVoice, voiceToCommand } from "@/lib/ai-couples/voice";
import { approveDraft, findDraftByTgMessage, tgApi } from "@/lib/ai-couples/wa-drafts";
import { decideRule, removeRule, rulesListText } from "@/lib/ai-couples/wa-learning";

export const dynamic = "force-dynamic";

type TgUpdate = {
  message?: { chat?: { id?: number | string }; text?: string; voice?: unknown; reply_to_message?: { message_id?: number } };
  callback_query?: { id: string; data?: string; message?: { message_id?: number; chat?: { id?: number | string } } };
};

/** Öneri onayı: düğmeye basıldı ya da öneriye "gönder" yazıldı */
const APPROVE_RE = /^\s*(g[öo]nder|onay|onayl[ıi]yorum|evet\s*g[öo]nder|tamam\s*g[öo]nder)(\s|[.!]|$)/i;
async function runApproval(draftId: string, chatId: string | number, tgMessageId?: number) {
  const r = await approveDraft(draftId);
  if (tgMessageId && (r.ok || r.draft?.status === "sent")) {
    // düğmeyi kaldır (ikinci kez basılmasın)
    await tgApi("editMessageReplyMarkup", { chat_id: chatId, message_id: tgMessageId, reply_markup: { inline_keyboard: [] } });
  }
  await tgApi("sendMessage", { chat_id: chatId, text: r.msg, ...(tgMessageId ? { reply_to_message_id: tgMessageId } : {}) });
}

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
  // Telegram'a her zaman 200 dön (aksi halde aynı güncellemeyi tekrar yollar).
  const cb = update?.callback_query;
  if (cb) {
    const cbChat = cb.message?.chat?.id;
    if (!allowedChat || String(cbChat) !== allowedChat) {
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id });
      return NextResponse.json({ ok: true });
    }
    if (cb.data?.startsWith("lr:")) {
      // Öğrenme önerisi: lr:y:<id> = kural olsun, lr:n:<id> = hayır
      const yes = cb.data.startsWith("lr:y:");
      const r = await decideRule(cb.data.slice(5), yes);
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: yes ? "Kural eklendi" : "Eklenmedi" });
      if (r.decided && cb.message?.message_id) await tgApi("editMessageReplyMarkup", { chat_id: allowedChat, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });
      await tgApi("sendMessage", { chat_id: allowedChat, text: r.msg, ...(cb.message?.message_id ? { reply_to_message_id: cb.message.message_id } : {}) });
    } else if (cb.data?.startsWith("igd:")) {
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Gönderiliyor…" });
      const [, igsid, id] = cb.data.split(":");
      const { igTaslakOnayla } = await import("@/lib/instagram-dm");
      const r = await igTaslakOnayla(igsid ?? "", id ?? "").catch(() => ({ ok: false, msg: "⚠️ Gönderim sırasında hata oldu, Instagram'dan kendiniz yazın." }));
      if (r.ok && cb.message?.message_id) await tgApi("editMessageReplyMarkup", { chat_id: allowedChat, message_id: cb.message.message_id, reply_markup: { inline_keyboard: [] } });
      await tgApi("sendMessage", { chat_id: allowedChat, text: r.msg, ...(cb.message?.message_id ? { reply_to_message_id: cb.message.message_id } : {}) });
    } else if (cb.data?.startsWith("wad:")) {
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id, text: "Gönderiliyor…" });
      await runApproval(cb.data.slice(4), allowedChat, cb.message?.message_id).catch(async () => {
        await sendTelegramMessage("⚠️ Gönderim sırasında hata oldu, lütfen kendiniz yazın.").catch(() => false);
      });
    } else {
      await tgApi("answerCallbackQuery", { callback_query_id: cb.id });
    }
    return NextResponse.json({ ok: true });
  }
  const chatId = update?.message?.chat?.id;
  if (!allowedChat || String(chatId) !== allowedChat) return NextResponse.json({ ok: true });

  // Öğrenilen kurallar: /kurallar · /kuralsil 2
  const cmdText = update?.message?.text?.trim() ?? "";
  if (/^\/kurallar\b/i.test(cmdText)) {
    await sendTelegramMessage(await rulesListText()).catch(() => false);
    return NextResponse.json({ ok: true });
  }
  const del = cmdText.match(/^\/kuralsil\s+(\d+)/i);
  if (del) {
    await sendTelegramMessage(await removeRule(Number(del[1]))).catch(() => false);
    return NextResponse.json({ ok: true });
  }

  // Öneri mesajına "gönder / onaylıyorum" diye cevap yazıldı
  const replyTo = update?.message?.reply_to_message?.message_id;
  if (replyTo && update?.message?.text && APPROVE_RE.test(update.message.text)) {
    const { igTaslakBul, igTaslakOnayla } = await import("@/lib/instagram-dm");
    const ig = await igTaslakBul(replyTo);
    if (ig) {
      const r = await igTaslakOnayla(ig.igsid, ig.id).catch(() => ({ ok: false, msg: "⚠️ Gönderim sırasında hata oldu, Instagram'dan kendiniz yazın." }));
      if (r.ok) await tgApi("editMessageReplyMarkup", { chat_id: allowedChat, message_id: replyTo, reply_markup: { inline_keyboard: [] } });
      await tgApi("sendMessage", { chat_id: allowedChat, text: r.msg, reply_to_message_id: replyTo });
      return NextResponse.json({ ok: true });
    }
    const d = await findDraftByTgMessage(replyTo);
    if (d) {
      await runApproval(d.id, allowedChat, replyTo).catch(async () => {
        await sendTelegramMessage("⚠️ Gönderim sırasında hata oldu, lütfen kendiniz yazın.").catch(() => false);
      });
      return NextResponse.json({ ok: true });
    }
  }

  const voice = update?.message?.voice as { file_id?: string } | undefined;
  if (voice?.file_id) {
    const spoken = await transcribeTelegramVoice(voice.file_id).catch(() => null);
    if (!spoken) {
      await sendTelegramMessage("🎙️ Sesi anlayamadım, tekrar söyler misin? Ya da yazarak sor: /yardim");
      return NextResponse.json({ ok: true });
    }
    const cmd = voiceToCommand(spoken);
    try {
      await sendTelegramMessage(`🎙️ Anladığım: "${spoken}"\n\n${await answerCommand(cmd)}`);
    } catch {
      await sendTelegramMessage(`🎙️ Anladığım: "${spoken}"\n⚠️ Komut işlenemedi.`);
    }
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
