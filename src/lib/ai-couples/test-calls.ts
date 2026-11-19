/**
 * Panelden TEST araması: girilen numarayı sesli asistan hemen arar (saat kuralı yok).
 * Görüşme hiçbir çift kaydına yazılmaz, WhatsApp gitmez (n8n B3 "TEST" kimliğini atlar).
 * Kayıt listesi: DATA_DIR/ai-test-calls.json — ses kaydı ve metin ElevenLabs'ten okunur.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { selamFor } from "@/lib/ai-couples/hitap";
import { findCoupleByPhone } from "@/lib/ai-couples/store";
import { historyForAgent } from "@/lib/ai-couples/journey";
import { capacitySpeech, dayLabel, monthKeyOf, readCapacityConfig, upcomingCapacity } from "@/lib/ai-couples/capacity";

const FILE = dataPath("ai-test-calls.json");

/** ElevenLabs asistanı ve Verimor hattı (gizli değil — kimlik numaraları) */
export const ELEVEN_AGENT_ID = "agent_0301m7qz00bxfejakmkvz2bze4m9";
export const ELEVEN_PHONE_ID = "phnum_3701m7qz02fbenzb885yjst20hwm";

export type TestCallRecord = {
  id: string; // ElevenLabs conversation_id
  phone: string;
  name: string;
  weddingDate?: string;
  at: string;
};

export type TestCallDetail = TestCallRecord & {
  status?: string;
  durationSec?: number;
  summary?: string;
  sonuc?: string;
  transcript?: { role: "agent" | "user"; text: string; at?: number }[];
};

export async function readTestCalls(): Promise<TestCallRecord[]> {
  try {
    const list = JSON.parse(await readFile(FILE, "utf-8")) as TestCallRecord[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

async function writeTestCalls(list: TestCallRecord[]): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify(list.slice(0, 50), null, 2), "utf-8");
}

/** Numarayı arar; başarılıysa kaydı listeye ekler. */
export async function startTestCall(input: { phone: string; name?: string; weddingDate?: string }): Promise<{ ok: true; record: TestCallRecord } | { ok: false; error: string }> {
  const { elevenlabsKey } = await readIntegrations();
  if (!elevenlabsKey) return { ok: false, error: "Ses anahtarı (ElevenLabs) ayarlı değil" };

  // Numara kayıtlı bir çiftse asistan o çiftin geçmişiyle konuşur (hafıza testi) — kayda yine YAZILMAZ
  const known = await findCoupleByPhone(input.phone);
  const name = (input.name ?? "").trim() || known?.name || "";
  const cfg = await readCapacityConfig();
  const months = await upcomingCapacity(14, cfg);
  const wdIn = input.weddingDate || known?.weddingDate;
  const wd = wdIn && /^\d{4}-\d{2}-\d{2}$/.test(wdIn) ? wdIn : undefined;
  const isim = name.split(/\s+/)[0] || "bilinmiyor";

  const res = await fetch("https://api.elevenlabs.io/v1/convai/sip-trunk/outbound-call", {
    method: "POST",
    headers: { "xi-api-key": elevenlabsKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      agent_id: ELEVEN_AGENT_ID,
      agent_phone_number_id: ELEVEN_PHONE_ID,
      to_number: input.phone,
      conversation_initiation_client_data: {
        dynamic_variables: {
          selam: selamFor(name),
          couple_id: "TEST",
          isim,
          kaynak: "Düğün.com",
          dugun_tarihi: wd ? dayLabel(wd) : "bilinmiyor",
          kontenjan_tablo: capacitySpeech(months, monthKeyOf(wd)) || "yok",
          drone_kalan: String(cfg.droneGiftLeft ?? 0),
          tekrar_arama: "hayır",
          gecmis: known ? historyForAgent(known) : "İlk temas — daha önce görüşülmedi.",
        },
      },
    }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);
  if (!res) return { ok: false, error: "Ses servisine ulaşılamadı" };
  const j = (await res.json().catch(() => ({}))) as { success?: boolean; conversation_id?: string; message?: string; detail?: unknown };
  if (!res.ok || !j.conversation_id) {
    const why = typeof j.detail === "string" ? j.detail : j.message ?? JSON.stringify(j.detail ?? j).slice(0, 200);
    return { ok: false, error: `Arama başlatılamadı: ${why}` };
  }
  const record: TestCallRecord = { id: j.conversation_id, phone: input.phone, name: name ? name + (known ? " (kayıtlı çift — geçmişiyle)" : "") : "Test", weddingDate: wd, at: new Date().toISOString() };
  await writeTestCalls([record, ...(await readTestCalls())]);
  return { ok: true, record };
}

/** Görüşmenin durumunu, süresini, özetini ve metnini ElevenLabs'ten okur. */
export async function testCallDetail(rec: TestCallRecord): Promise<TestCallDetail> {
  const { elevenlabsKey } = await readIntegrations();
  if (!elevenlabsKey) return rec;
  const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${rec.id}`, {
    headers: { "xi-api-key": elevenlabsKey },
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!res?.ok) return rec;
  const c = (await res.json().catch(() => ({}))) as {
    status?: string;
    metadata?: { call_duration_secs?: number };
    analysis?: { transcript_summary?: string; data_collection_results?: Record<string, { value?: unknown }> };
    transcript?: { role: string; message?: string | null; time_in_call_secs?: number }[];
  };
  const dc = c.analysis?.data_collection_results ?? {};
  const ozet = dc.ozet?.value;
  return {
    ...rec,
    status: c.status,
    durationSec: c.metadata?.call_duration_secs,
    summary: typeof ozet === "string" && ozet.trim() ? ozet : c.analysis?.transcript_summary,
    sonuc: typeof dc.sonuc?.value === "string" ? (dc.sonuc.value as string) : undefined,
    transcript: (c.transcript ?? [])
      .filter((t) => (t.message ?? "").trim())
      .map((t) => ({ role: t.role === "agent" ? "agent" : "user", text: String(t.message), at: t.time_in_call_secs })),
  };
}
