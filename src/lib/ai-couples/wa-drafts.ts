/**
 * WhatsApp yapay zekâ ÖNERİLERİ (öneri modu): cevap müşteriye gitmez, Telegram'a "✅ Gönder" düğmesiyle düşer.
 * Sahibi düğmeye basar (ya da öneriye "gönder" yazar) → panelin WhatsApp yolu (n8n P1) ile gider.
 * Kayıt: DATA_DIR/ai-wa-drafts.json (son 300 öneri).
 */
import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath, reloadPersistentEnv } from "@/lib/data-dir";
import { siteConfig } from "@/config/site";
import { getTelegramWebhookSecret } from "@/lib/ai-couples/auth";
import { getCouple } from "@/lib/ai-couples/store";
import { callPanelHook } from "@/lib/ai-couples/integrations";

const FILE = dataPath("ai-wa-drafts.json");
const MAX_AGE_MS = 48 * 3600_000;

export type WaDraft = {
  id: string;
  coupleId: string;
  name: string;
  text: string;
  createdAt: string;
  status: "pending" | "sending" | "sent";
  tgMessageId?: number;
  sentAt?: string;
  /** Sahibi düğmeye basmadan kendisi yazdıysa: yazdığı metin (öğrenme için) */
  ownerText?: string;
  ownerAt?: string;
  /** Instagram DM önerisi ise müşterinin Instagram kimliği (coupleId = "ig:<igsid>") */
  igsid?: string;
};

const normText = (t: string) => t.toLocaleLowerCase("tr-TR").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/**
 * Sahibi müşteriye elle yazdı → son 12 saatteki açık öneriyle eşleştir.
 *  approval: onaylanan önerinin kendisi gidiyor (öğrenilecek bir şey yok)
 *  copied:   öneriyi kopyalayıp aynen göndermiş
 *  edited:   öneriden farklı yazmış → öğrenme fırsatı
 */
export type OwnerMatch = { kind: "approval" | "copied" | "edited"; draft: WaDraft } | null;
export async function matchOwnerReply(coupleId: string, text: string): Promise<OwnerMatch> {
  return locked<OwnerMatch>(async (list) => {
    const now = Date.now();
    const d = [...list].reverse().find((x) => x.coupleId === coupleId && now - Date.parse(x.createdAt) < 12 * 3600_000);
    if (!d) return { out: null };
    const same = normText(d.text) === normText(text);
    if (d.status !== "pending") return { out: same ? { kind: "approval" as const, draft: d } : null };
    // Art arda birkaç mesaj yazdıysa birleştir
    const ownerText = d.ownerText ? `${d.ownerText}\n${text}` : text;
    const kind = !d.ownerText && same ? ("copied" as const) : ("edited" as const);
    const next = { ...d, ownerText: ownerText.slice(0, 2000), ownerAt: new Date().toISOString() };
    return { list: list.map((x) => (x.id === d.id ? next : x)), out: { kind, draft: next } };
  });
}

/** Bu metin asistanın bir önerisi mi? (onaylanıp ya da kopyalanıp gönderilmiş → sahibinin kendi yazısı sayılmaz) */
export async function draftTexts(): Promise<Set<string>> {
  return locked(async (list) => ({ out: new Set(list.map((d) => normText(d.text))) }));
}
export const normDraftText = normText;

export async function getDraft(id: string): Promise<WaDraft | null> {
  return locked(async (list) => ({ out: list.find((d) => d.id === id) ?? null }));
}

let chain: Promise<unknown> = Promise.resolve();
/** Dosyaya sırayla eriş (aynı anda iki düğme basımı çift gönderim yapmasın) */
function locked<T>(fn: (list: WaDraft[]) => Promise<{ list?: WaDraft[]; out: T }>): Promise<T> {
  const run = chain.then(async () => {
    let list: WaDraft[] = [];
    try {
      list = JSON.parse(await readFile(FILE, "utf-8")) as WaDraft[];
    } catch {
      list = [];
    }
    const r = await fn(list);
    if (r.list) {
      await mkdir(path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(r.list.slice(-300), null, 1), "utf-8");
      await rename(tmp, FILE);
    }
    return r.out;
  });
  chain = run.catch(() => undefined);
  return run;
}

/* ---------------- Telegram ---------------- */

type TgResult<T> = { ok?: boolean; result?: T; description?: string };

export async function tgApi<T = unknown>(method: string, body: object): Promise<TgResult<T> | null> {
  reloadPersistentEnv();
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  if (!token) return null;
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  }).catch(() => null);
  return ((await res?.json().catch(() => null)) as TgResult<T> | null) ?? null;
}

export function tgChatId(): string {
  reloadPersistentEnv();
  return process.env.TELEGRAM_CHAT_ID?.trim() ?? "";
}

let webhookChecked = false;
/** Düğme basımlarının (callback_query) siteye gelmesi için webhook'u bir kez kontrol et / düzelt */
export async function ensureTelegramWebhook(): Promise<void> {
  if (webhookChecked) return;
  const info = await tgApi<{ url?: string; allowed_updates?: string[] }>("getWebhookInfo", {});
  const url = `${siteConfig.url}/api/telegram/webhook`;
  const au = info?.result?.allowed_updates;
  // allowed_updates boşsa Telegram hepsini (callback_query dahil) yollar
  const okAlready = info?.ok && info.result?.url === url && (!au || au.length === 0 || au.includes("callback_query"));
  if (okAlready) {
    webhookChecked = true;
    return;
  }
  const r = await tgApi("setWebhook", {
    url,
    secret_token: getTelegramWebhookSecret(),
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: false,
  });
  if (r?.ok) webhookChecked = true;
}

/** Öneriyi kaydet + Telegram'a "✅ Gönder" düğmesiyle at. Döner: Telegram'a gitti mi */
export async function createDraftAndNotify(input: { coupleId: string; text: string; tg: string }): Promise<boolean> {
  const couple = await getCouple(input.coupleId);
  const text = input.text.trim().slice(0, 3000);
  if (!couple || !text) return false;
  const chatId = tgChatId();
  if (!chatId) return false;
  await ensureTelegramWebhook().catch(() => undefined);
  const draft: WaDraft = { id: randomUUID().replace(/-/g, "").slice(0, 16), coupleId: couple.id, name: couple.name, text, createdAt: new Date().toISOString(), status: "pending" };
  await locked(async (list) => ({ list: [...list, draft], out: null }));
  const sent = await tgApi<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: `${input.tg.slice(0, 3600)}\n\n👇 Müşteriye göndermek için düğmeye basın (ya da bu mesaja "gönder" yazın). Basmazsanız hiçbir şey gitmez.`,
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [[{ text: "✅ Gönder", callback_data: `wad:${draft.id}` }]] },
  });
  const mid = sent?.result?.message_id;
  if (mid) await locked(async (list) => ({ list: list.map((d) => (d.id === draft.id ? { ...d, tgMessageId: mid } : d)), out: null }));
  return Boolean(sent?.ok);
}

/** Instagram DM önerisi: kaydet + Telegram'a "✅ Gönder" düğmesiyle at (müşteriye hiçbir şey gitmez) */
export async function createIgDraftAndNotify(input: { igsid: string; name: string; text: string; tg: string }): Promise<boolean> {
  const text = input.text.trim().slice(0, 990);
  const chatId = tgChatId();
  if (!text || !chatId) return false;
  await ensureTelegramWebhook().catch(() => undefined);
  const draft: WaDraft = { id: randomUUID().replace(/-/g, "").slice(0, 16), coupleId: `ig:${input.igsid}`, igsid: input.igsid, name: input.name, text, createdAt: new Date().toISOString(), status: "pending" };
  await locked(async (list) => ({ list: [...list, draft], out: null }));
  const sent = await tgApi<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: `${input.tg.slice(0, 3600)}\n\n👇 Instagram'dan göndermek için düğmeye basın (ya da bu mesaja "gönder" yazın). Basmazsanız hiçbir şey gitmez.`,
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [[{ text: "✅ Gönder", callback_data: `wad:${draft.id}` }]] },
  });
  const mid = sent?.result?.message_id;
  if (mid) await locked(async (list) => ({ list: list.map((d) => (d.id === draft.id ? { ...d, tgMessageId: mid } : d)), out: null }));
  return Boolean(sent?.ok);
}

export async function findDraftByTgMessage(messageId: number): Promise<WaDraft | null> {
  return locked(async (list) => ({ out: list.find((d) => d.tgMessageId === messageId) ?? null }));
}

/**
 * Sahibi onayladı → kontrol et ve gönder. Döner: Telegram'da gösterilecek kısa sonuç.
 * Göndermez: öneri eskiyse, zaten gittiyse, sonrasında müşteriye başka mesaj gittiyse (siz yazmışsanız),
 * müşteri kara listede / mesajlar iptal / kaybedildi ise.
 */
export async function approveDraft(id: string): Promise<{ ok: boolean; msg: string; draft?: WaDraft }> {
  const claim = await locked<{ ok: boolean; msg: string; draft?: WaDraft }>(async (list) => {
    const d = list.find((x) => x.id === id);
    if (!d) return { out: { ok: false, msg: "Bu öneri bulunamadı." } };
    if (d.status === "sent") return { out: { ok: false, msg: `Bu mesaj zaten gönderildi (${d.name}).`, draft: d } };
    if (d.status === "sending") return { out: { ok: false, msg: "Bu mesaj şu an gönderiliyor, bekleyin.", draft: d } };
    if (Date.now() - Date.parse(d.createdAt) > MAX_AGE_MS) return { out: { ok: false, msg: "Bu öneri 2 günden eski — göndermedim. Gerekirse kendiniz yazın.", draft: d } };
    return { list: list.map((x) => (x.id === id ? { ...x, status: "sending" as const } : x)), out: { ok: true, msg: "", draft: d } };
  });
  if (!claim.ok || !claim.draft) return claim;
  const d = claim.draft;
  const release = (status: WaDraft["status"]) =>
    locked(async (list) => ({ list: list.map((x) => (x.id === id ? { ...x, status, ...(status === "sent" ? { sentAt: new Date().toISOString() } : {}) } : x)), out: null }));

  // Instagram DM önerisi
  if (d.igsid) {
    const { approveIgSend } = await import("@/lib/ai-couples/ig-agent");
    const r = await approveIgSend(d.igsid, d.text, d.createdAt);
    await release(r.ok ? "sent" : "pending");
    return { ok: r.ok, msg: r.ok ? `✅ Instagram'dan gönderildi — ${d.name}` : `${d.name}: ${r.msg}`, draft: d };
  }

  const c = await getCouple(d.coupleId);
  let block: string | null = null;
  if (!c) block = "Müşteri kaydı bulunamadı.";
  else if (c.contactLocked) block = "Müşteri kara listede (iletişim istemiyor) — göndermedim.";
  else if (c.messagesPaused) block = "Bu müşteriye mesajlar iptal edilmiş — göndermedim.";
  else if (c.messages.some((m) => m.direction === "out" && Date.parse(m.at) > Date.parse(d.createdAt))) {
    block = "Bu öneriden sonra müşteriye zaten mesaj gitmiş (siz yazmış olabilirsiniz) — çift mesaj olmasın diye göndermedim.";
  }
  if (block) {
    await release("pending");
    return { ok: false, msg: `${d.name}: ${block}`, draft: d };
  }
  const r = await callPanelHook("wa", { coupleId: d.coupleId, text: d.text });
  if (!r.ok) {
    await release("pending");
    const why = typeof r.data.error === "string" ? r.data.error : typeof r.data.reason === "string" ? r.data.reason : `hata ${r.status}`;
    return { ok: false, msg: `⚠️ ${d.name}: gönderilemedi (${why}). Tekrar basabilir ya da kendiniz yazabilirsiniz.`, draft: d };
  }
  await release("sent");
  return { ok: true, msg: `✅ Gönderildi — ${d.name}`, draft: d };
}
