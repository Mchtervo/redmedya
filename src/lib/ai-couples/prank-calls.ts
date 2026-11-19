/**
 * 🎭 ŞAKA araması — sahibinin YAKINLARINA, panelden elle yazılan numaraya.
 * Müşteri akışından tamamen ayrı: ayrı sesli asistan, ayrı n8n akışı (rm-panel-prank);
 * çift kaydı AÇMAZ, WhatsApp göndermez, kuyruğa/istatistiğe girmez.
 * Güvenlik: müşteri kaydı olan numara aranmaz; günlük sınır var.
 * Liste: DATA_DIR/ai-prank-calls.json — ses/metin ElevenLabs'ten okunur.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { callPanelHook, readIntegrations } from "@/lib/ai-couples/integrations";
import { findCoupleByPhone } from "@/lib/ai-couples/store";
import { selamFor } from "@/lib/ai-couples/hitap";

const FILE = dataPath("ai-prank-calls.json");
export const PRANK_DAILY_LIMIT = 10;
export const PRANK_MODES = ["esprili", "ciddi", "makara"] as const;
export const PRANK_DURATIONS = ["kısa", "normal", "uzun"] as const;
export type PrankMode = (typeof PRANK_MODES)[number];
export type PrankDuration = (typeof PRANK_DURATIONS)[number];

export type PrankRecord = { id: string; phone: string; name: string; mode: PrankMode; duration: PrankDuration; topic?: string; info?: string; at: string };
export type PrankDetail = PrankRecord & { status?: string; durationSec?: number; transcript?: { role: "agent" | "user"; text: string; at?: number }[] };

export async function readPranks(): Promise<PrankRecord[]> {
  try {
    const list = JSON.parse(await readFile(FILE, "utf-8")) as PrankRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

const istDay = (iso: string | number) => new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });

export async function prankCountToday(): Promise<number> {
  const today = istDay(Date.now());
  return (await readPranks()).filter((r) => istDay(r.at) === today).length;
}

export async function startPrank(input: { phone: string; name?: string; mode: PrankMode; duration: PrankDuration; topic?: string; info?: string }): Promise<{ ok: true; record: PrankRecord } | { ok: false; error: string }> {
  // Müşteri (gerçek çift) kaydı olan numaraya şaka araması YAPILMAZ
  const couple = await findCoupleByPhone(input.phone);
  if (couple && couple.sourceRef !== "test") return { ok: false, error: "Bu numara müşteri kaydında — şaka araması yapılamaz." };
  if ((await prankCountToday()) >= PRANK_DAILY_LIMIT) return { ok: false, error: `Günlük şaka araması sınırı doldu (${PRANK_DAILY_LIMIT}). Yarın tekrar deneyin.` };

  const name = (input.name ?? "").trim().slice(0, 40);
  const r = await callPanelHook("prank", { phone: input.phone, name, selam: name ? selamFor(name) : "", mode: input.mode, duration: input.duration, topic: (input.topic ?? "").trim().slice(0, 800), info: (input.info ?? "").trim().slice(0, 1200), from: "Mücahit" });
  const conv = typeof r.data.conversationId === "string" ? r.data.conversationId : "";
  if (!r.ok || !conv) {
    const why = typeof r.data.error === "string" ? r.data.error : `otomasyon cevabı ${r.status}`;
    if (/\b(480|408|487)\b|no.?answer|temporarily/i.test(why)) return { ok: false, error: "Telefon çaldı ama açılmadı (ya da kapalı / kapsama dışı)." };
    if (/\b(486|600|603)\b|busy|declin/i.test(why)) return { ok: false, error: "Hat meşgul ya da arama reddedildi." };
    return { ok: false, error: `Arama başlatılamadı: ${why}` };
  }
  const record: PrankRecord = { id: conv, phone: input.phone, name: name || "—", mode: input.mode, duration: input.duration, topic: (input.topic ?? "").trim().slice(0, 800) || undefined, info: (input.info ?? "").trim().slice(0, 1200) || undefined, at: new Date().toISOString() };
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify([record, ...(await readPranks())].slice(0, 60), null, 2), "utf-8");
  return { ok: true, record };
}

const done = new Map<string, PrankDetail>();

export async function prankDetail(rec: PrankRecord): Promise<PrankDetail> {
  const hit = done.get(rec.id);
  if (hit) return hit;
  const { elevenlabsKey } = await readIntegrations();
  if (!elevenlabsKey) return rec;
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${rec.id}`, { headers: { "xi-api-key": elevenlabsKey }, signal: AbortSignal.timeout(15_000) }).catch(() => null);
  if (!res?.ok) return rec;
  const c = (await res.json().catch(() => ({}))) as { status?: string; metadata?: { call_duration_secs?: number }; transcript?: { role: string; message?: string | null; time_in_call_secs?: number }[] };
  const out: PrankDetail = {
    ...rec,
    status: c.status,
    durationSec: c.metadata?.call_duration_secs,
    transcript: (c.transcript ?? []).filter((t) => (t.message ?? "").trim()).map((t) => ({ role: t.role === "agent" ? "agent" : "user", text: String(t.message), at: t.time_in_call_secs })),
  };
  if (out.status === "done") {
    done.set(rec.id, out);
    if (done.size > 100) done.delete(done.keys().next().value!);
  }
  return out;
}
