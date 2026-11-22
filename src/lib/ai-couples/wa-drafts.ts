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
  status: "pending" | "sending" | "sent" | "cancelled";
  tgMessageId?: number;
  sentAt?: string;
  /** Sahibi düğmeye basmadan kendisi yazdıysa: yazdığı metin (öğrenme için) */
  ownerText?: string;
  ownerAt?: string;
  /** Instagram DM önerisi ise müşterinin Instagram kimliği (coupleId = "ig:<igsid>") */
  igsid?: string;
  /** Gönderilen metin (panelden düzenlenip gönderildiyse öneriden farklı olabilir) */
  sentText?: string;
  /** Nereden onaylandı */
  via?: "telegram" | "panel";
  /** Onaysız bekliyor hatırlatması gönderildi mi */
  remindedAt?: string;
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
    if (d.status === "cancelled" && d.ownerText) {
      const next = { ...d, ownerText: `${d.ownerText}\n${text}`.slice(0, 2000), ownerAt: new Date().toISOString() };
      return { list: list.map((x) => (x.id === d.id ? next : x)), out: { kind: "edited" as const, draft: next } };
    }
    if (d.status !== "pending") return { out: same ? { kind: "approval" as const, draft: d } : null };
    // Art arda birkaç mesaj yazdıysa birleştir
    const ownerText = d.ownerText ? `${d.ownerText}\n${text}` : text;
    const kind = !d.ownerText && same ? ("copied" as const) : ("edited" as const);
    const asIs = kind === "copied";
    const next = asIs
      ? { ...d, status: "sent" as const, sentAt: new Date().toISOString(), sentText: text, via: "panel" as const }
      : { ...d, status: "cancelled" as const, ownerText: ownerText.slice(0, 2000), ownerAt: new Date().toISOString() };
    if (d.tgMessageId) void stripTgButton(d.tgMessageId, asIs ? `✅ Telefondan gönderdiniz — ${d.name} (onaylandı sayıldı)` : "✍️ Bu müşteriye siz yazdınız — öneri kapandı (farkı not aldım).");
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
  await supersedeAndAdd(draft);
  const sent = await tgApi<{ message_id: number }>("sendMessage", {
    chat_id: chatId,
    text: `${input.tg.slice(0, 3000)}\n\n📲 Telefondan göndermek için (mesaj hazır açılır): ${waLink(couple.phone, text)}\n\n👇 Ya da düğmeye basın (veya bu mesaja "gönder" yazın). Basmazsanız hiçbir şey gitmez.`,
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
  await supersedeAndAdd(draft);
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
export async function approveDraft(id: string, opts: { text?: string; via?: "telegram" | "panel" } = {}): Promise<{ ok: boolean; msg: string; draft?: WaDraft }> {
  const claim = await locked<{ ok: boolean; msg: string; draft?: WaDraft }>(async (list) => {
    const d = list.find((x) => x.id === id);
    if (!d) return { out: { ok: false, msg: "Bu öneri bulunamadı." } };
    if (d.status === "sent") return { out: { ok: false, msg: `Bu mesaj zaten gönderildi (${d.name}).`, draft: d } };
    if (d.status === "sending") return { out: { ok: false, msg: "Bu mesaj şu an gönderiliyor, bekleyin.", draft: d } };
    if (d.status === "cancelled") return { out: { ok: false, msg: "Bu öneri iptal edildi — yerine yeni öneri gönderildi, onu kullanın.", draft: d } };
    if (Date.now() - Date.parse(d.createdAt) > MAX_AGE_MS) return { out: { ok: false, msg: "Bu öneri 2 günden eski — göndermedim. Gerekirse kendiniz yazın.", draft: d } };
    return { list: list.map((x) => (x.id === id ? { ...x, status: "sending" as const } : x)), out: { ok: true, msg: "", draft: d } };
  });
  if (!claim.ok || !claim.draft) return claim;
  const d0 = claim.draft;
  const sendText = (opts.text ?? d0.text).trim().slice(0, d0.igsid ? 990 : 3000) || d0.text;
  const d = { ...d0, text: sendText };
  const via = opts.via ?? "telegram";
  const release = async (status: WaDraft["status"]) => {
    await locked(async (list) => ({ list: list.map((x) => (x.id === id ? { ...x, status, ...(status === "sent" ? { sentAt: new Date().toISOString(), sentText: sendText, via } : {}) } : x)), out: null }));
    // Panelden gönderildiyse Telegram'daki düğmeyi kaldır
    if (status === "sent" && via === "panel" && d0.tgMessageId) await stripTgButton(d0.tgMessageId, `✅ Panelden gönderildi — ${d0.name}`);
    // Panelde metni değiştirip gönderdiyse: farktan ders çıkar (sahibine sorulur)
    if (status === "sent" && normText(sendText) !== normText(d0.text)) {
      await locked(async (list) => ({ list: list.map((x) => (x.id === id ? { ...x, ownerText: sendText, ownerAt: new Date().toISOString() } : x)), out: null }));
      const { learnFromEditedDraft } = await import("@/lib/ai-couples/wa-learning");
      learnFromEditedDraft(id);
    }
  };

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

/** Bu müşteri için belirtilen andan sonra oluşturulmuş, hâlâ bekleyen öneri var mı? */
export async function hasPendingDraft(coupleKey: string, sinceIso: string): Promise<boolean> {
  return locked(async (list) => ({ out: list.some((d) => d.coupleId === coupleKey && d.status === "pending" && d.createdAt >= sinceIso) }));
}

/** Bu müşterinin bekleyen önerilerini iptal et (yenisi hazırlanacak) */
export async function cancelPendingDrafts(coupleKey: string): Promise<number> {
  return locked(async (list) => {
    const n = list.filter((d) => d.coupleId === coupleKey && d.status === "pending").length;
    return { list: list.map((d) => (d.coupleId === coupleKey && d.status === "pending" ? { ...d, status: "cancelled" as const } : d)), out: n };
  });
}

/** Telegram öneri mesajındaki düğmeyi kaldır (+ isteğe bağlı kısa not) */
async function stripTgButton(messageId: number, note?: string): Promise<void> {
  const chatId = tgChatId();
  if (!chatId) return;
  await tgApi("editMessageReplyMarkup", { chat_id: chatId, message_id: messageId, reply_markup: { inline_keyboard: [] } }).catch(() => null);
  if (note) await tgApi("sendMessage", { chat_id: chatId, text: note, reply_to_message_id: messageId }).catch(() => null);
}

/** Aynı müşterinin bekleyen eski önerilerini iptal edip yenisini ekle (eski düğmeler kalkar) */
async function supersedeAndAdd(draft: WaDraft): Promise<void> {
  const old = await locked(async (list) => {
    const prev = list.filter((d) => d.coupleId === draft.coupleId && d.status === "pending");
    return { list: [...list.map((d) => (d.coupleId === draft.coupleId && d.status === "pending" ? { ...d, status: "cancelled" as const } : d)), draft], out: prev };
  });
  for (const d of old) if (d.tgMessageId) await stripTgButton(d.tgMessageId);
}

/** Panelden "gönderme" (öneriyi kapat) */
export async function rejectDraft(id: string, via: "panel" | "telegram" = "panel"): Promise<{ ok: boolean; msg: string }> {
  const d = await locked(async (list) => {
    const x = list.find((y) => y.id === id);
    if (!x || x.status !== "pending") return { out: x ?? null };
    return { list: list.map((y) => (y.id === id ? { ...y, status: "cancelled" as const } : y)), out: x };
  });
  if (!d) return { ok: false, msg: "Öneri bulunamadı" };
  if (d.status !== "pending") return { ok: false, msg: d.status === "sent" ? "Bu öneri zaten gönderilmiş" : "Bu öneri zaten kapalı" };
  if (d.tgMessageId) await stripTgButton(d.tgMessageId, via === "panel" ? `✖ Panelden kapatıldı (gönderilmedi) — ${d.name}` : undefined);
  return { ok: true, msg: "Öneri kapatıldı" };
}

export type PendingDraftView = {
  id: string;
  channel: "whatsapp" | "instagram";
  coupleId?: string;
  igsid?: string;
  name: string;
  phone?: string;
  username?: string;
  text: string;
  createdAt: string;
  summary?: string;
  customer: { at: string; text: string }[];
  expiresAt: string;
};

/** Panel: bekleyen öneriler (müşteri başına en yenisi), müşterinin son mesajları ve özetiyle */
export async function listPendingDrafts(): Promise<PendingDraftView[]> {
  const list = await locked(async (l) => ({ out: l }));
  const now = Date.now();
  const latest = new Map<string, WaDraft>();
  for (const d of list) {
    if (d.status !== "pending") continue;
    const limit = d.igsid ? 23.5 * 3600_000 : MAX_AGE_MS;
    if (now - Date.parse(d.createdAt) > limit) continue;
    const cur = latest.get(d.coupleId);
    if (!cur || cur.createdAt < d.createdAt) latest.set(d.coupleId, d);
  }
  const out: PendingDraftView[] = [];
  let threads: { igsid: string; name?: string; username?: string; summary?: string; messages: { at: string; dir: string; text: string }[] }[] = [];
  if ([...latest.values()].some((d) => d.igsid)) {
    const { listThreads } = await import("@/lib/ai-couples/ig-agent");
    threads = await listThreads();
  }
  for (const d of latest.values()) {
    if (d.igsid) {
      const t = threads.find((x) => x.igsid === d.igsid);
      const msgs = t?.messages ?? [];
      const lastOut = msgs.map((m) => m.dir).lastIndexOf("out");
      out.push({
        id: d.id, channel: "instagram", igsid: d.igsid, name: t?.name || d.name, username: t?.username, text: d.text, createdAt: d.createdAt, summary: t?.summary,
        customer: msgs.slice(lastOut + 1).filter((m) => m.dir === "in").slice(-4).map((m) => ({ at: m.at, text: m.text.slice(0, 400) })),
        expiresAt: new Date(Date.parse(d.createdAt) + 23.5 * 3600_000).toISOString(),
      });
    } else {
      const c = await getCouple(d.coupleId);
      if (!c) continue;
      const lastOut = c.messages.map((m) => m.direction).lastIndexOf("out");
      out.push({
        id: d.id, channel: "whatsapp", coupleId: c.id, name: c.name, phone: c.phone, text: d.text, createdAt: d.createdAt, summary: c.aiSummary,
        customer: c.messages.slice(lastOut + 1).filter((m) => m.direction === "in").slice(-4).map((m) => ({ at: m.at, text: m.text.slice(0, 400) })),
        expiresAt: new Date(Date.parse(d.createdAt) + MAX_AGE_MS).toISOString(),
      });
    }
  }
  return out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** 45 dakikadır onay bekleyen öneriler için sahibine bir kez Telegram hatırlatması (08:00–23:00) */
export async function remindStaleDrafts(): Promise<number> {
  const hour = Number(new Date().toLocaleString("en-US", { timeZone: "Europe/Istanbul", hour: "numeric", hour12: false })) % 24;
  if (hour < 8 || hour >= 23) return 0;
  const now = Date.now();
  const due = await locked(async (list) => {
    const d = list.filter((x) => x.status === "pending" && !x.remindedAt && now - Date.parse(x.createdAt) > 45 * 60_000 && now - Date.parse(x.createdAt) < (x.igsid ? 23 : 47) * 3600_000);
    if (!d.length) return { out: [] as WaDraft[] };
    const ids = new Set(d.map((x) => x.id));
    return { list: list.map((x) => (ids.has(x.id) ? { ...x, remindedAt: new Date().toISOString() } : x)), out: d };
  });
  const chatId = tgChatId();
  if (!due.length || !chatId) return 0;
  const lines = due.map((d) => {
    const mins = Math.round((now - Date.parse(d.createdAt)) / 60_000);
    const t = mins < 120 ? `${mins} dk` : `${Math.round(mins / 60)} saat`;
    return `• ${d.name} (${d.igsid ? "Instagram" : "WhatsApp"}) — ${t}dır cevap bekliyor${d.igsid ? " · Instagram 24 saat sonra izin vermez" : ""}`;
  });
  await tgApi("sendMessage", { chat_id: chatId, text: `⏰ ONAY BEKLEYEN CEVAPLAR\n${lines.join("\n")}\n\nÖnerilerin altındaki ✅ Gönder'e basın ya da panelin en üstündeki "Cevap bekleyenler" bölümünden gönderin.` });
  for (const d of due) if (d.tgMessageId) await tgApi("sendMessage", { chat_id: chatId, text: "⬆️ Bu öneri hâlâ onay bekliyor", reply_to_message_id: d.tgMessageId }).catch(() => null);
  return due.length;
}

/** wa.me linki: telefonda WhatsApp sohbetini mesaj yazılı halde açar */
export function waLink(phone: string, text: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(text)}`;
}

/** Kısıtlama / elle gönderme modu: bekleyen her öneriyi Telegram'a kopyala-gönder biçiminde yolla (link + sadece metin) */
export async function sendCopyHelpers(): Promise<number> {
  const chatId = tgChatId();
  if (!chatId) return 0;
  const drafts = await listPendingDrafts();
  for (const d of drafts) {
    const who = d.channel === "instagram" ? `${d.name}${d.username ? " (@" + d.username + ")" : ""} · Instagram` : `${d.name} · ${d.phone ? d.phone.replace(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4") : ""}`;
    const head =
      d.channel === "whatsapp" && d.phone
        ? `📋 KOPYALA-GÖNDER — ${who}\n💬 Müşteri: ${d.customer.map((c) => c.text).join(" / ").slice(0, 300) || "-"}\n\n📲 Tek dokunuşla (mesaj hazır açılır): ${waLink(d.phone, d.text)}\n\nYa da aşağıdaki mesajı basılı tutup kopyalayın 👇`
        : `📋 KOPYALA-GÖNDER — ${who}\n💬 Müşteri: ${d.customer.map((c) => c.text).join(" / ").slice(0, 300) || "-"}\n\nAşağıdaki mesajı kopyalayıp Instagram'dan gönderin 👇`;
    await tgApi("sendMessage", { chat_id: chatId, text: head, disable_web_page_preview: true });
    await tgApi("sendMessage", { chat_id: chatId, text: d.text, disable_web_page_preview: true });
  }
  return drafts.length;
}
