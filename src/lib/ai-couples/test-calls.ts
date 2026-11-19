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
  /** Sistemin bu görüşmeden sonra yaptığı plan (ör. "Tekrar arama zamanı: …") */
  plan?: string[];
  /** Görüşmeden sonra giden WhatsApp mesajları */
  whatsapp?: { at: string; text: string }[];
};

const titleCase = (n: string) =>
  n
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr-TR") + w.slice(1).toLocaleLowerCase("tr-TR"))
    .join(" ");

/** Görüşmeden sonra sistemin aldığı notlar ve giden WhatsApp'lar (çift kaydından) */
async function afterCall(rec: TestCallRecord): Promise<Pick<TestCallDetail, "plan" | "whatsapp">> {
  const couple = await findCoupleByPhone(rec.phone);
  if (!couple) return {};
  const call = couple.calls.find((x) => x.externalId === rec.id);
  if (!call) return {};
  // Bu görüşmeden bir sonraki aramaya kadar olanlar
  const from = Date.parse(call.at);
  const next = couple.calls.find((x) => Date.parse(x.at) > from);
  const to = next ? Date.parse(next.at) : Infinity;
  const inRange = (at: string) => Date.parse(at) >= from - 1000 && Date.parse(at) < to;
  const plan = couple.timeline.filter((e) => inRange(e.at) && e.type !== "call" && e.type !== "message").map((e) => e.text);
  if (!next && couple.callbackAt && Date.parse(couple.callbackAt) > Date.now() && !plan.some((p) => p.startsWith("Tekrar arama"))) {
    plan.push(`Tekrar arama zamanı: ${new Date(couple.callbackAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}`);
  }
  const whatsapp = couple.messages.filter((m) => m.direction === "out" && m.channel === "whatsapp" && inRange(m.at)).map((m) => ({ at: m.at, text: m.text }));
  return { plan: plan.slice(0, 6), whatsapp: whatsapp.slice(0, 6) };
}

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
  const name = titleCase((input.name ?? "").trim());
  let couple = await findCoupleByPhone(input.phone);
  if (!couple) {
    const r = await ingestCouple({ name: name || "Deneme", phone: input.phone, source: "manual", sourceRef: TEST_REF, note: "🧪 Panelden test araması" });
    if (!r.ok) return { ok: false, error: r.error };
    couple = r.couple;
  } else if (couple.sourceRef === TEST_REF) {
    // Her test temiz başlar: önceki denemenin sonucu (ilgilenmiyor, sonra arayın…) yenisini engellemesin; geçmiş kalır (hafıza testi)
    couple =
      (await mutateCouple(couple.id, (c) => ({
        ...c,
        name: name || c.name,
        status: "new",
        grade: "cold",
        callbackRequested: false,
        callbackAt: undefined,
        busyRetries: 0,
        followUpAt: undefined,
        followUpSentAt: undefined,
      }))) ?? couple;
  }
  if (couple.contactLocked) return { ok: false, error: `Bu numara kara listede (${couple.lockReason ?? "iletişim kapalı"}) — aranamaz` };
  if (couple.status === "won" && couple.sourceRef !== TEST_REF) return { ok: false, error: "Bu numara rezervasyon yapmış gerçek bir çift — test için başka numara kullanın" };

  // Gerçek aramalarla AYNI yol: n8n → ElevenLabs (site sunucusundan doğrudan bağlantıya gerek yok)
  const r = await callPanelHook("call", { coupleId: couple.id });
  const conv = typeof r.data.conversationId === "string" ? r.data.conversationId : "";
  if (!r.ok || !conv) {
    const why = typeof r.data.error === "string" ? r.data.error : `otomasyon cevabı ${r.status}`;
    // SIP 480 / 408 / 487 = arama gitti, telefon çaldı ama açılmadı (ya da kapalı / kapsama dışı); 486 = meşgul
    if (/\b(480|408|487)\b|no.?answer|temporarily/i.test(why)) return { ok: false, error: "Telefon çaldı ama açılmadı (ya da telefon kapalı / kapsama dışı). Hat çalışıyor — tekrar deneyebilirsiniz." };
    if (/\b(486|600|603)\b|busy|declin/i.test(why)) return { ok: false, error: "Hat meşgul ya da arama reddedildi. Biraz sonra tekrar deneyin." };
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
// Bitmiş görüşmenin ElevenLabs detayı değişmez → bellekte tut (liste her yenilemede 8 ayrı istek atmasın)
const doneCache = new Map<string, TestCallDetail>();

export async function testCallDetail(rec: TestCallRecord): Promise<TestCallDetail> {
  const hit = doneCache.get(rec.id);
  const base = hit ?? (await baseDetail(rec));
  if (!hit && base.status === "done" && base.transcript?.length) {
    doneCache.set(rec.id, base);
    if (doneCache.size > 100) doneCache.delete(doneCache.keys().next().value!);
  }
  if (base.status !== "done") return base;
  return { ...base, ...(await afterCall(rec).catch(() => ({}))) };
}

async function baseDetail(rec: TestCallRecord): Promise<TestCallDetail> {
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
      const spoke = (c.transcript ?? []).some((t) => t.role === "user" && (t.message ?? "").replace(/[.\s]/g, ""));
      const ozet = dc.ozet?.value;
      return {
        ...rec,
        status: c.status,
        durationSec: c.metadata?.call_duration_secs,
        // Özet her zaman Türkçe: asistanın kendi özeti yoksa (kısa görüşme) İngilizce otomatik özet yerine sade açıklama
        summary: typeof ozet === "string" && ozet.trim() ? ozet : c.status === "done" ? (spoke ? `Telefonu açtı ama görüşme tamamlanmadı (${c.metadata?.call_duration_secs ?? 0} sn) — karşı taraf kapattı ya da yarıda kaldı.` : "Açılmadı / konuşma olmadı.") : undefined,
        // "no_answer" ama karşı taraf konuştuysa: açtı, görüşme tamamlanmadı
        sonuc: typeof dc.sonuc?.value === "string" ? (dc.sonuc.value === "no_answer" && spoke ? "hung_up" : (dc.sonuc.value as string)) : undefined,
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
