/**
 * Panelden TEST araması — gerçek akışın aynısı:
 *  numara → (yoksa) "🧪 Test" etiketli çift açılır → n8n "panelden ara" ile sesli asistan hemen arar (saat kuralı yok)
 *  → görüşme analiz edilir (B3) → görüşmeye göre kişisel WhatsApp teklifi gider (K) → panelde/Hareketler'de görünür.
 * Test çiftleri (sourceRef "test") istatistiklere sayılmaz ve otomatik olarak tekrar ARANMAZ.
 * Liste: DATA_DIR/ai-test-calls.json — ses/metin ElevenLabs'ten, olmazsa çiftin arama kaydından okunur.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { callPanelHook, readIntegrations } from "@/lib/ai-couples/integrations";
import { findCoupleByPhone, ingestCouple, mutateCouple } from "@/lib/ai-couples/store";

const FILE = dataPath("ai-test-calls.json");
export const TEST_REF = "test";

export type TestCallRecord = {
  id: string; // ElevenLabs conversation_id
  phone: string;
  name: string;
  coupleId?: string;
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
export async function startTestCall(input: { phone: string; name?: string }): Promise<{ ok: true; record: TestCallRecord } | { ok: false; error: string }> {
  const name = (input.name ?? "").trim();
  let couple = await findCoupleByPhone(input.phone);
  if (!couple) {
    const r = await ingestCouple({ name: name || "Deneme", phone: input.phone, source: "manual", sourceRef: TEST_REF, note: "🧪 Panelden test araması" });
    if (!r.ok) return { ok: false, error: r.error };
    couple = r.couple;
  } else if (couple.sourceRef === TEST_REF && name && couple.name !== name) {
    couple = (await mutateCouple(couple.id, (c) => ({ ...c, name }))) ?? couple;
  }
  if (couple.contactLocked) return { ok: false, error: `Bu numara kara listede (${couple.lockReason ?? "iletişim kapalı"}) — aranamaz` };

  // Gerçek aramalarla AYNI yol: n8n → ElevenLabs (site sunucusundan doğrudan bağlantıya gerek yok)
  const r = await callPanelHook("call", { coupleId: couple.id });
  const conv = typeof r.data.conversationId === "string" ? r.data.conversationId : "";
  if (!r.ok || !conv) {
    const why = typeof r.data.error === "string" ? r.data.error : `otomasyon cevabı ${r.status}`;
    return { ok: false, error: `Arama başlatılamadı: ${why}` };
  }
  const record: TestCallRecord = {
    id: conv,
    phone: input.phone,
    name: couple.sourceRef === TEST_REF ? couple.name : `${couple.name} (kayıtlı çift — gerçek kayda yazılır)`,
    coupleId: couple.id,
    weddingDate: couple.weddingDate,
    at: new Date().toISOString(),
  };
  await writeTestCalls([record, ...(await readTestCalls())]);
  return { ok: true, record };
}

/** Görüşmenin durumu/süresi/özeti/metni: önce ElevenLabs, olmazsa çiftin arama kaydı (B3 yazar). */
export async function testCallDetail(rec: TestCallRecord): Promise<TestCallDetail> {
  const { elevenlabsKey } = await readIntegrations();
  if (elevenlabsKey) {
    const res = await fetch(`https://api.elevenlabs.io/v1/convai/conversations/${rec.id}`, {
      headers: { "xi-api-key": elevenlabsKey },
      signal: AbortSignal.timeout(15_000),
    }).catch(() => null);
    if (res?.ok) {
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
  }
  // Yedek: B3'ün çift kaydına yazdığı arama
  const couple = await findCoupleByPhone(rec.phone);
  const call = couple?.calls.find((x) => x.externalId === rec.id);
  if (!call) return rec;
  return {
    ...rec,
    status: "done",
    durationSec: call.durationSec,
    summary: call.summary,
    sonuc: call.outcome,
    transcript: (call.transcript ?? "")
      .split("\n")
      .filter(Boolean)
      .map((l) => ({ role: l.startsWith("Asistan:") ? ("agent" as const) : ("user" as const), text: l.replace(/^(Asistan|Çift):\s*/, "") })),
  };
}
