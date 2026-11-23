/**
 * WhatsApp "kaçanları topla": Evolution'daki son mesajları panel kayıtlarıyla karşılaştırır, eksikleri işler.
 *
 * Neden: WhatsApp bağlantısı kopukken (ya da webhook bir mesajı kaçırdığında) müşterinin yazdığı ve sahibinin
 * telefondan yazdığı mesajlar siteye hiç ulaşmıyor; bağlantı gelince WhatsApp bunları Evolution'a geçmiş olarak
 * veriyor ama webhook tetiklenmiyor. Sonuç: asistan konuşmayı eksik biliyor, cevapsız müşteri kalıyor.
 *
 * Bu iş (15 dakikada bir, kuyruk isteğiyle tetiklenir):
 *  1) Eksik gelen / giden mesajları asıl saatleriyle kayda yazar (aynı mesaj iki kez yazılmaz).
 *  2) "Gönderilemedi" görünen ama aslında telefondan gitmiş mesajı "gitti" yapar.
 *  3) İçeriği okunmamış belge / fotoğrafı okur.
 *  4) Son mesajı müşteriden olan ve bekleyen önerisi olmayan çift için cevap önerisi hazırlar.
 *  5) Numarası gizli (LID) olup panelde bulunamayan yazışmayı sahibine Telegram'dan bildirir.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { siteConfig } from "@/config/site";
import { getAiApiToken } from "@/lib/ai-couples/auth";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { readAutomation, isWaManual } from "@/lib/ai-couples/automation";
import { normalizePhone, displayPhone } from "@/lib/ai-couples/rules";
import { getCouple, mutateCouple, readCouples } from "@/lib/ai-couples/store";
import { lidPhone, rememberLid, resolveLid } from "@/lib/ai-couples/wa-lid";
import { describeWaMedia, type WaMediaMeta } from "@/lib/ai-couples/wa-media";
import { docNote, isClosingText, isDelivered } from "@/lib/ai-couples/doc-note";
import { createDraftAndNotify, hasPendingDraft, matchOwnerReply } from "@/lib/ai-couples/wa-drafts";
import { sendTelegramMessage } from "@/lib/lead-notify";
import type { AiCouple } from "@/types/ai-couples";

const STATE = dataPath("ai-wa-reconcile.json");
type State = { lidAlerts: Record<string, number>; drafted: Record<string, string>; digestDay?: string };

type EvoMsg = {
  key?: { id?: string; fromMe?: boolean; remoteJid?: string; remoteJidAlt?: string; senderPn?: string; participantAlt?: string };
  pushName?: string;
  messageType?: string;
  message?: Record<string, unknown> | null;
  messageTimestamp?: number | string;
};
type Item = { id: string; fromMe: boolean; ts: number; text: string; media?: WaMediaMeta; phone: string; lid: string };

export type ReconcileReport = {
  ok: boolean;
  scanned: number;
  missing: { name: string; dir: "in" | "out"; at: string; text: string }[];
  unfailed: number;
  enriched: number;
  drafts: string[];
  unknownLids: { lid: string; name: string; lines: string[] }[];
  error?: string;
};

async function readState(): Promise<State> {
  try {
    const s = JSON.parse(await readFile(STATE, "utf-8")) as Partial<State>;
    return { lidAlerts: s.lidAlerts ?? {}, drafted: s.drafted ?? {}, digestDay: s.digestDay };
  } catch {
    return { lidAlerts: {}, drafted: {} };
  }
}
async function writeState(s: State): Promise<void> {
  await mkdir(path.dirname(STATE), { recursive: true });
  const tmp = `${STATE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(s, null, 1), "utf-8");
  await rename(tmp, STATE);
}

const norm = (t: string) => t.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");
const STATUS_PREFIX = /^\[(GERİ ÇEKİLDİ|GÖNDERİLEMEDİ)\]\s*/;

/** Evolution mesajından metin + dosya bilgisi (n8n C "Mesajı çöz" ile aynı kurallar) */
export function parseEvoMessage(d: EvoMsg): { text: string; media?: WaMediaMeta } | null {
  let m = (d.message ?? {}) as Record<string, unknown>;
  // sarmalanmış mesajlar: süreli mesaj, tek görüntüleme, açıklamalı belge
  for (let i = 0; i < 3; i++) {
    const w = (m.ephemeralMessage ?? m.viewOnceMessage ?? m.viewOnceMessageV2 ?? m.documentWithCaptionMessage) as { message?: Record<string, unknown> } | undefined;
    if (w?.message) m = w.message;
    else break;
  }
  const s = (v: unknown) => (typeof v === "string" ? v : "");
  const ext = m.extendedTextMessage as { text?: string } | undefined;
  const img = m.imageMessage as { caption?: string; mimetype?: string; fileLength?: unknown } | undefined;
  const vid = m.videoMessage as { caption?: string } | undefined;
  const doc = m.documentMessage as { fileName?: string; caption?: string; mimetype?: string; fileLength?: unknown } | undefined;
  const size = (v: unknown) => {
    const n = Number(typeof v === "object" && v !== null && "low" in v ? (v as { low: number }).low : v);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };
  if (doc) {
    const name = s(doc.fileName).slice(0, 120);
    const cap = s(doc.caption).trim();
    return { text: (`[belge] ${name}`.trim() + (cap && cap !== name ? ` — "${cap.slice(0, 300)}"` : "")).trim(), media: { kind: "document", fileName: name || undefined, mime: s(doc.mimetype) || undefined, size: size(doc.fileLength) } };
  }
  if (img) {
    const cap = s(img.caption).trim();
    return { text: cap ? `[fotoğraf] "${cap.slice(0, 600)}"` : "[fotoğraf]", media: { kind: "image", mime: s(img.mimetype) || undefined, size: size(img.fileLength) } };
  }
  const text = s(m.conversation) || s(ext?.text) || s(vid?.caption) || (m.audioMessage ? "[sesli mesaj]" : "") || (vid ? "[video]" : "");
  return text ? { text: text.slice(0, 3900) } : null;
}

async function fetchEvolution(sinceMs: number): Promise<{ msgs: EvoMsg[]; base: string; key: string; inst: string } | null> {
  const { evolutionUrl, evolutionKey, evolutionInstance } = await readIntegrations();
  if (!evolutionUrl || !evolutionKey) return null;
  const base = evolutionUrl.replace(/\/$/, "");
  const inst = encodeURIComponent(evolutionInstance || "redmedia");
  const out: EvoMsg[] = [];
  for (let page = 1; page <= 12; page++) {
    const res = await fetch(`${base}/chat/findMessages/${inst}`, {
      method: "POST",
      headers: { apikey: evolutionKey, "Content-Type": "application/json" },
      body: JSON.stringify({ where: {}, page, offset: 100 }),
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (!res?.ok) return page === 1 ? null : { msgs: out, base, key: evolutionKey, inst };
    const j = (await res.json().catch(() => null)) as { messages?: { records?: EvoMsg[] } } | null;
    const recs = j?.messages?.records ?? [];
    out.push(...recs);
    const oldest = Math.min(...recs.map((r) => Number(r.messageTimestamp) * 1000 || Infinity));
    if (recs.length < 100 || oldest < sinceMs) break;
  }
  return { msgs: out, base, key: evolutionKey, inst };
}

async function contactName(base: string, key: string, inst: string, lid: string): Promise<string> {
  const res = await fetch(`${base}/chat/findContacts/${inst}`, { method: "POST", headers: { apikey: key, "Content-Type": "application/json" }, body: JSON.stringify({ where: { remoteJid: lid } }), signal: AbortSignal.timeout(10_000) }).catch(() => null);
  const j = (await res?.json().catch(() => null)) as { pushName?: string }[] | null;
  const n = Array.isArray(j) ? String(j[0]?.pushName ?? "") : "";
  return /\p{L}{2,}/u.test(n) ? n.slice(0, 60) : "";
}

async function selfPost(pathname: string, body: unknown, timeoutMs = 25_000): Promise<{ status: number; data: Record<string, unknown> }> {
  const res = await fetch(`${siteConfig.url}${pathname}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getAiApiToken()}`, "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  }).catch(() => null);
  return { status: res?.status ?? 0, data: ((await res?.json().catch(() => ({}))) ?? {}) as Record<string, unknown> };
}

/** Kayıtta bu mesaj var mı? "failed": aynı metin "gönderilemedi" diye kayıtlı (aslında gitmiş) */
function findRecord(c: AiCouple, it: Item): "yes" | "failed" | "no" {
  const dir = it.fromMe ? "out" : "in";
  const t = norm(it.text);
  const isMedia = it.text.startsWith("[");
  let failed = false;
  for (const m of c.messages) {
    if (m.waId && m.waId === it.id) return "yes";
    if (m.direction !== dir || (m.channel !== "whatsapp" && m.channel !== "telegram")) continue;
    const gap = Math.abs(Date.parse(m.at) - it.ts);
    if (gap > 36 * 3600_000) continue;
    const isFailed = m.text.startsWith("[GÖNDERİLEMEDİ]");
    const mt = norm(m.text.replace(STATUS_PREFIX, ""));
    const same = mt === t || (t.length >= 40 && mt.includes(t.slice(0, 80))) || (mt.length >= 40 && t.includes(mt.slice(0, 80))) || (isMedia && m.text.startsWith("[") && !STATUS_PREFIX.test(m.text) && gap < 30 * 60_000);
    if (!same) continue;
    if (isFailed) failed = true;
    else return "yes";
  }
  return failed ? "failed" : "no";
}

let running = false;
let lastRun = 0;

/** Kuyruk isteğinden çağrılır: en fazla 15 dakikada bir, arka planda */
export function maybeReconcile(): void {
  if (running || Date.now() - lastRun < 15 * 60_000) return;
  lastRun = Date.now();
  void reconcileWa({ hours: 30 })
    .catch((e) => console.error("[wa-reconcile]", e))
    .then(() => unansweredDigest())
    .catch((e) => console.error("[wa-digest]", e));
}

/**
 * Günde bir kez (10:00'dan sonra): müşterinin yazıp bizim cevap vermediğimiz yazışmaları sahibine hatırlat.
 * Öneri onaylanmadan süresi dolan, asistanın "cevap gerekmez" dediği ama aslında soru soran müşteri burada yakalanır.
 */
export async function unansweredDigest(force = false): Promise<string[]> {
  const nowD = new Date();
  const day = nowD.toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const hour = Number(nowD.toLocaleTimeString("en-GB", { timeZone: "Europe/Istanbul", hour: "2-digit", hour12: false }).slice(0, 2));
  const state = await readState();
  if (!force && (state.digestDay === day || hour < 10 || hour >= 21)) return [];
  const now = nowD.getTime();
  const rows: { at: number; line: string }[] = [];
  for (const c of await readCouples()) {
    if (c.sourceRef === "test" || c.contactLocked || c.status === "won" || c.status === "lost") continue;
    const msgs = c.messages.filter(isDelivered);
    const last = msgs.at(-1);
    if (!last || last.direction !== "in") continue;
    const age = now - Date.parse(last.at);
    if (age < 3 * 3600_000 || age > 7 * 86_400_000) continue;
    let i = msgs.length - 1;
    while (i >= 0 && msgs[i].direction === "in" && isClosingText(msgs[i].text)) i--;
    if (i < 0 || msgs[i].direction !== "in") continue; // sadece teşekkür / kapanış → cevap beklemiyor
    const h = Math.round(age / 3600_000);
    rows.push({ at: Date.parse(last.at), line: `• ${c.name} (${displayPhone(c.phone)}) — ${h < 24 ? `${h} saattir` : `${Math.round(h / 24)} gündür`} bekliyor: "${docNote(last.text).replace(/\s+/g, " ").slice(0, 110)}"` });
  }
  if (!force) {
    state.digestDay = day;
    await writeState(state).catch(() => undefined);
  }
  if (!rows.length) return [];
  rows.sort((a, b) => a.at - b.at);
  const lines = rows.map((r) => r.line);
  await sendTelegramMessage(`⏰ CEVAP BEKLEYEN ${lines.length} MÜŞTERİ (son yazan onlar, biz dönmedik):\n\n${lines.slice(0, 20).join("\n")}\n\nPanelde "Cevap bekleyenler" bölümünden önerileri onaylayabilir ya da kendiniz yazabilirsiniz.`).catch(() => false);
  return lines;
}

export async function reconcileWa(opts: { hours?: number; dry?: boolean } = {}): Promise<ReconcileReport> {
  const rep: ReconcileReport = { ok: true, scanned: 0, missing: [], unfailed: 0, enriched: 0, drafts: [], unknownLids: [] };
  if (running) return { ...rep, ok: false, error: "zaten çalışıyor" };
  running = true;
  try {
    const now = Date.now();
    const since = now - Math.min(240, Math.max(1, opts.hours ?? 30)) * 3600_000;
    const evo = await fetchEvolution(since);
    if (!evo) return { ...rep, ok: false, error: "Evolution'a ulaşılamadı / ayar yok" };

    // Aynı mesaj hem numara hem gizli kimlik (LID) ile iki kez durur → mesaj kimliğine göre birleştir
    const byId = new Map<string, Item>();
    for (const d of evo.msgs) {
      const id = d.key?.id;
      const ts = Number(d.messageTimestamp) * 1000;
      if (!id || !Number.isFinite(ts) || ts < since) continue;
      const jids = [d.key?.remoteJid, d.key?.remoteJidAlt, d.key?.senderPn, d.key?.participantAlt].filter((x): x is string => typeof x === "string");
      if (jids.some((j) => j.endsWith("@g.us") || j === "status@broadcast" || j.endsWith("@newsletter") || j.endsWith("@broadcast"))) continue;
      const pn = jids.find((j) => j.endsWith("@s.whatsapp.net"));
      const lid = jids.find((j) => j.endsWith("@lid")) ?? "";
      const phone = pn ? (normalizePhone(pn.split("@")[0]) ?? "") : "";
      const parsed = parseEvoMessage(d);
      const prev = byId.get(id);
      if (prev) {
        if (phone && !prev.phone) prev.phone = phone;
        if (lid && !prev.lid) prev.lid = lid;
        continue;
      }
      if (!parsed) continue;
      if (!phone && !lid) continue;
      byId.set(id, { id, fromMe: d.key?.fromMe === true, ts, text: parsed.text, media: parsed.media, phone, lid });
    }
    const items = [...byId.values()].sort((a, b) => a.ts - b.ts);
    rep.scanned = items.length;

    // Gizli kimlik ↔ numara eşleşmelerini öğren (bizim gönderdiğimiz mesajlar iki kimlikle de kayıtlı)
    for (const it of items) if (it.phone && it.lid && !opts.dry) await rememberLid(it.lid, it.phone, "aynı mesaj iki kimlikle kayıtlı").catch(() => undefined);

    const couples = await readCouples();
    const byPhone = new Map(couples.map((c) => [c.phone, c]));
    const lidCache = new Map<string, AiCouple | null>();
    const resolve = async (it: Item): Promise<AiCouple | null> => {
      if (it.phone) return byPhone.get(it.phone) ?? null;
      if (lidCache.has(it.lid)) return lidCache.get(it.lid) ?? null;
      let c: AiCouple | null = null;
      const pair = items.find((x) => x.lid === it.lid && x.phone)?.phone ?? (await lidPhone(it.lid).catch(() => undefined));
      if (pair) c = byPhone.get(pair) ?? null;
      if (!c && !opts.dry && items.some((x) => x.lid === it.lid && !x.fromMe)) {
        const name = await contactName(evo.base, evo.key, evo.inst, it.lid);
        if (name) c = await resolveLid(it.lid, name, false).catch(() => null);
      }
      lidCache.set(it.lid, c);
      return c;
    };

    const state = await readState();
    const touched = new Set<string>();
    const unknown = new Map<string, Item[]>();
    let enrichBudget = 4;
    for (const it of items) {
      if (now - it.ts < 5 * 60_000) continue; // canlı akış (n8n C) zaten işliyor — yarışma
      const c = await resolve(it);
      if (!c) {
        if (!it.phone && it.lid) unknown.set(it.lid, [...(unknown.get(it.lid) ?? []), it]);
        continue; // listede olmayan numara (arkadaş / aile) yok sayılır
      }
      if (c.sourceRef === "test") continue;
      const fresh = (await getCouple(c.id)) ?? c;
      const found = findRecord(fresh, it);
      if (found === "yes") {
        // İçeriği okunmamış belge / fotoğraf: oku ve kayda ekle
        if (it.media && enrichBudget > 0 && !opts.dry) {
          const dir = it.fromMe ? "out" : "in";
          const rec = fresh.messages.find((m) => m.direction === dir && m.text.startsWith("[") && !STATUS_PREFIX.test(m.text) && !m.text.includes("İÇERİK:") && !/fiyat[-_ ]?listesi/i.test(m.text) && Math.abs(Date.parse(m.at) - it.ts) < 30 * 60_000);
          if (rec) {
            enrichBudget--;
            const sum = await describeWaMedia(it.id, it.media, it.fromMe).catch(() => null);
            if (sum) {
              await mutateCouple(fresh.id, (x) => ({ ...x, messages: x.messages.map((m) => (m.id === rec.id ? { ...m, waId: it.id, text: `${m.text} — İÇERİK: ${sum}`.slice(0, 4000) } : m)) }));
              rep.enriched++;
            }
          }
        }
        continue;
      }
      rep.missing.push({ name: fresh.name, dir: it.fromMe ? "out" : "in", at: new Date(it.ts).toISOString(), text: it.text.slice(0, 160) });
      if (found === "failed") rep.unfailed++;
      if (opts.dry) continue;
      const r = await selfPost(`/api/ai/couples/${encodeURIComponent(fresh.id)}/messages`, {
        channel: "whatsapp",
        direction: it.fromMe ? "out" : "in",
        kind: "reply",
        fromPhone: it.fromMe,
        text: it.text,
        at: new Date(it.ts).toISOString(),
        waId: it.id,
        backfill: true,
        ...(it.media ? { media: it.media } : {}),
      }, 80_000);
      if (r.status === 200) {
        touched.add(fresh.id);
        // Telefondan gönderdiğiniz mesaj bekleyen öneriyle aynıysa öneri kapanır (sonradan tekrar gönderilmesin)
        if (it.fromMe) await matchOwnerReply(fresh.id, it.text).catch(() => null);
      }
    }

    // Kaçan mesajı müşteriden olan ve hâlâ cevapsız duran çiftlere cevap önerisi
    const auto = await readAutomation();
    if (!opts.dry && auto.waAiMode !== "off" && !isWaManual(auto)) {
      for (const id of touched) {
        if (rep.drafts.length >= 5) break;
        const c = await getCouple(id);
        const last = c?.messages.at(-1);
        if (!c || !last || last.direction !== "in" || last.channel !== "whatsapp") continue;
        if (now - Date.parse(last.at) > 72 * 3600_000) continue;
        if (state.drafted[id] === last.id || (await hasPendingDraft(id, last.at))) continue;
        const r = await selfPost(`/api/ai/couples/${encodeURIComponent(id)}/ai-reply`, { text: last.text }, 115_000);
        const b = r.data as { action?: string; text?: string; draft?: string; reason?: string; summary?: string; note?: string };
        if (r.status !== 200) continue;
        state.drafted[id] = last.id;
        const when = new Date(last.at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
        const musteri = `\n\n💬 Müşteri: ${last.text.slice(0, 400)}\n(${when} — WhatsApp bağlantısı kopukken gelmiş, şimdi yakalandı)`;
        const text = b.action === "send" ? b.text : b.action === "handoff" ? b.draft : undefined;
        if (text) {
          const tg = b.action === "send"
            ? `✍️ CEVAP ÖNERİSİ (onayınızı bekliyor) — ${c.name}${b.summary ? `\n📍 ${b.summary.slice(0, 240)}` : ""}${musteri}\n\n🤖 Önerdiğim cevap:\n${text.slice(0, 1200)}${b.note ? `\n\n📌 ${b.note.slice(0, 300)}` : ""}`
            : `👤 SİZ DÖNÜN — ${c.name}\n📝 ${(b.reason ?? "").slice(0, 400)}${musteri}\n\n✏️ Önerilen cevap: ${text.slice(0, 900)}`;
          if (await createDraftAndNotify({ coupleId: id, text, tg }).catch(() => false)) rep.drafts.push(c.name);
        } else if (b.action === "handoff") {
          await sendTelegramMessage(`👤 SİZ DÖNÜN — ${c.name} - ${displayPhone(c.phone)}\n📝 ${(b.reason ?? "").slice(0, 400)}${musteri}`).catch(() => false);
          rep.drafts.push(c.name);
        }
      }
    }

    // Numarası gizli olup panelde bulunamayan yazışmalar (müşteri yazmışsa) → sahibine bir kez bildir
    for (const [lid, list] of unknown) {
      const ins = list.filter((x) => !x.fromMe);
      if (!ins.length) continue;
      const lastTs = ins[ins.length - 1].ts;
      const name = opts.dry ? "" : await contactName(evo.base, evo.key, evo.inst, lid);
      const lines = list.slice(-8).map((x) => `${x.fromMe ? "Siz" : "Müşteri"}: ${x.text.replace(/\s+/g, " ").slice(0, 160)}`);
      rep.unknownLids.push({ lid, name, lines });
      if (opts.dry || (state.lidAlerts[lid] ?? 0) >= lastTs) continue;
      state.lidAlerts[lid] = lastTs;
      await sendTelegramMessage(`📩 PANELDE OLMAYAN bir WhatsApp yazışması buldum (numarası gizli${name ? `, görünen ad: ${name}` : ""}).\nAsistanın bu müşteriyi takip edebilmesi için numarasını panelden "Yeni çift" olarak ekleyin.\n\n${lines.join("\n")}`).catch(() => false);
    }

    if (!opts.dry) {
      const keep = Object.entries(state.lidAlerts).sort((a, b) => b[1] - a[1]).slice(0, 200);
      state.lidAlerts = Object.fromEntries(keep);
      const dk = Object.keys(state.drafted);
      if (dk.length > 300) for (const k of dk.slice(0, dk.length - 300)) delete state.drafted[k];
      await writeState(state).catch(() => undefined);
      if (rep.missing.length) {
        const names = [...new Set(rep.missing.map((m) => m.name))];
        await sendTelegramMessage(`🔄 WhatsApp'ta kayda geçmemiş ${rep.missing.length} mesaj buldum ve işledim (${names.slice(0, 8).join(", ")}${names.length > 8 ? "…" : ""}). Asistan artık bu yazışmaları biliyor.${rep.drafts.length ? `\nCevap bekleyen ${rep.drafts.length} müşteri için öneri hazırladım.` : ""}`).catch(() => false);
      }
    }
    return rep;
  } finally {
    running = false;
  }
}
