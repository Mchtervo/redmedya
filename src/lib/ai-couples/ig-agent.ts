/**
 * INSTAGRAM DM ASİSTANI — reklamdan / profilden DM atan çifti karşılar.
 * Amaç: tebrik et → düğün tarihini öğren → gerçek kontenjanla (ayda 10 çift) aciliyet ver →
 * "detaylı bilgi ve size özel fiyat için 0312 963 23 47'den arayalım" diyerek TELEFON NUMARASINI al.
 * Numara gelince: çift panele eklenir (Instagram) → sesli asistan arar + WhatsApp karşılama (mevcut akış).
 *
 * Mod (otomasyon ayarı igAiMode): off | test (sadece igAiTestUsers kullanıcı adları) | all
 * Sahibi Instagram'dan elle yazarsa o sohbete 12 saat karışmaz.
 * Kayıt: DATA_DIR/ai-ig-threads.json
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { readAutomation } from "@/lib/ai-couples/automation";
import { checkDate, readCapacityConfig, upcomingCapacity } from "@/lib/ai-couples/capacity";
import { ingestCouple } from "@/lib/ai-couples/store";
import { normalizePhone, displayPhone } from "@/lib/ai-couples/rules";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { FACTS } from "@/lib/ai-couples/wa-agent";

const FILE = dataPath("ai-ig-threads.json");
const MODEL = "claude-sonnet-5-5";
const G = "https://graph.facebook.com/v21.0";
export const CALL_NUMBER = "0312 963 23 47";

type IgMsg = { at: string; dir: "in" | "out"; text: string; by?: "ai" | "owner" };
export type IgThread = {
  igsid: string;
  username?: string;
  name?: string;
  messages: IgMsg[];
  phone?: string;
  weddingDate?: string;
  coupleId?: string;
  ownerUntil?: string;
  test?: boolean;
  createdAt: string;
  updatedAt: string;
};

/* ---------------- kayıt ---------------- */

let chain: Promise<unknown> = Promise.resolve();
function withThreads<T>(fn: (m: Record<string, IgThread>) => Promise<{ map?: Record<string, IgThread>; out: T }>): Promise<T> {
  const run = chain.then(async () => {
    let m: Record<string, IgThread> = {};
    try {
      m = JSON.parse(await readFile(FILE, "utf-8")) as Record<string, IgThread>;
    } catch {
      m = {};
    }
    const r = await fn(m);
    if (r.map) {
      // en eski sohbetleri at (en fazla 1000)
      const entries = Object.entries(r.map).sort((a, b) => b[1].updatedAt.localeCompare(a[1].updatedAt)).slice(0, 1000);
      await mkdir(path.dirname(FILE), { recursive: true });
      const tmp = `${FILE}.${process.pid}.tmp`;
      await writeFile(tmp, JSON.stringify(Object.fromEntries(entries), null, 1), "utf-8");
      await rename(tmp, FILE);
    }
    return r.out;
  });
  chain = run.catch(() => undefined);
  return run;
}

const patchThread = (igsid: string, fn: (t: IgThread) => IgThread) =>
  withThreads(async (m) => {
    const now = new Date().toISOString();
    const cur = m[igsid] ?? { igsid, messages: [], createdAt: now, updatedAt: now };
    const next = { ...fn(cur), updatedAt: now };
    return { map: { ...m, [igsid]: next }, out: next };
  });

export async function listThreads(): Promise<IgThread[]> {
  return withThreads(async (m) => ({ out: Object.values(m).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) }));
}

/* ---------------- Meta ---------------- */

async function metaCfg() {
  const i = await readIntegrations();
  return { token: i.metaPageToken ?? "", pageId: i.metaPageId ?? "", appId: i.metaAppId ?? "" };
}

async function fetchProfile(igsid: string): Promise<{ username?: string; name?: string }> {
  const { token } = await metaCfg();
  if (!token) return {};
  const r = await fetch(`${G}/${igsid}?fields=name,username&access_token=${encodeURIComponent(token)}`, { signal: AbortSignal.timeout(8000) }).catch(() => null);
  const j = (await r?.json().catch(() => null)) as { name?: string; username?: string } | null;
  return { username: j?.username?.toLowerCase(), name: j?.name };
}

export async function sendIgMessage(igsid: string, text: string): Promise<{ ok: boolean; error?: string }> {
  const { token, pageId } = await metaCfg();
  if (!token || !pageId) return { ok: false, error: "Meta sayfa anahtarı ayarlı değil" };
  const r = await fetch(`${G}/${pageId}/messages?access_token=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipient: { id: igsid }, message: { text: text.slice(0, 990) } }),
    signal: AbortSignal.timeout(15000),
  }).catch(() => null);
  if (r?.ok) return { ok: true };
  const j = (await r?.json().catch(() => null)) as { error?: { message?: string } } | null;
  return { ok: false, error: j?.error?.message ?? `HTTP ${r?.status ?? "bağlantı yok"}` };
}

/* ---------------- gelen olaylar ---------------- */

const timers = new Map<string, ReturnType<typeof setTimeout>>();
const DEBOUNCE_MS = 20_000; // art arda yazılan kısa mesajları birlikte cevapla

/** Webhook: müşteri DM attı */
export async function onIgInbound(igsid: string, text: string, at: string): Promise<void> {
  const auto = await readAutomation();
  if (auto.igAiMode === "off") return;
  let t = await patchThread(igsid, (x) => ({ ...x, messages: [...x.messages, { at, dir: "in" as const, text: text.slice(0, 2000) }] }));
  if (!t.username && !t.name) {
    const p = await fetchProfile(igsid);
    t = await patchThread(igsid, (x) => ({ ...x, username: p.username, name: p.name }));
  }
  const isTest = !!t.username && auto.igAiTestUsers.includes(t.username);
  if (auto.igAiMode === "test" && !isTest) return; // test modunda sadece test hesabı
  if (isTest && !t.test) await patchThread(igsid, (x) => ({ ...x, test: true }));
  const old = timers.get(igsid);
  if (old) clearTimeout(old);
  timers.set(
    igsid,
    setTimeout(() => {
      timers.delete(igsid);
      void replyThread(igsid).catch((e) => console.error("[ig-agent]", e));
    }, DEBOUNCE_MS),
  );
}

/** Webhook: sayfadan giden mesaj (yankı). Bizim uygulama göndermediyse sahibi elle yazmıştır → 12 saat karışma */
export async function onIgEcho(igsid: string, text: string, at: string, appId: string | undefined): Promise<void> {
  const { appId: ours } = await metaCfg();
  if (appId && ours && String(appId) === String(ours)) return; // bizim gönderdiğimiz (zaten kayıtlı)
  await patchThread(igsid, (x) => ({ ...x, ownerUntil: new Date(Date.now() + 12 * 3600_000).toISOString(), messages: [...x.messages, { at, dir: "out" as const, text: text.slice(0, 2000), by: "owner" as const }] }));
}

/* ---------------- cevap ---------------- */

const PROMPT = `Sen RED MEDIA'nın (Ankara, düğün fotoğrafı ve sinematik video) Instagram hesabında DM'lere cevap veren, güler yüzlü ve işini bilen bir ekip üyesisin. Çiftler genelde reklamı görüp yazıyor.

TEK AMACIN: Çifti sıcak karşılamak ve ${CALL_NUMBER} numaralı hattımızdan aranmak üzere TELEFON NUMARASINI almak. Detaylı bilgi ve çifte özel fiyat telefonda verilecek.

AKIŞ (sırayla, her mesajda sadece bir adım):
1) İlk cevap: "Merhabalar, öncelikle hayırlı olsun 🤍" gibi sıcak bir tebrik; ismini biliyorsan ismiyle hitap et (Ayşe Hanım / Mehmet Bey; emin değilsen isimsiz). Sonra DÜĞÜN (ya da çekim) TARİHİNİ sor — "Düğün tarihiniz ve çekim yaptırmak istediğiniz tarih belli mi?" gibi. Müşteri zaten bir şey sorduysa önce onu kısaca cevapla.
2) Tarih gelince: MUTLAKA tarih_kontrol aracıyla bak. Sonra kontenjanı GERÇEK rakamla söyleyip harekete geçir: "2027 için her ay sadece 10 çift alıyoruz, [ay] için şu an X yerimiz kaldı" + 2027'ye özel erken rezervasyon fırsatlarından bahset. O gün doluysa dürüstçe söyle, alternatif günleri sun.
3) Hemen ardından numarayı iste: "Size 2027 erken rezervasyon fırsatlarını ve size özel fiyatı detaylı anlatmamız için ekibimiz ${CALL_NUMBER} numaralı hattımızdan sizi arasın; uygunsa iletişim numaranızı yazar mısınız?" (kendi cümlelerinle, doğal).
4) Numara alındıysa (aşağıda yazar): teşekkür et, "en kısa sürede ${CALL_NUMBER}'ten arayacağız, bu numarayı kaydedebilirsiniz" de. Artık tekrar numara isteme; sorusu varsa kısaca cevapla.

KURALLAR:
- Instagram DM üslubu: kısa (1-3 cümle), samimi ama saygılı, "esnaf ağzı kibar". En fazla 1 emoji. Asla uzun paragraf yok.
- Tarih sormadan numara isteme; ama müşteri tarihi söylemek istemezse yine de numarayı nazikçe iste.
- Fiyat sorulursa: kısa bir başlangıç bilgisi verebilirsin (aşağıdaki bilgilerden, uydurmadan) ama "size özel fiyat ve erken rezervasyon avantajını telefonda detaylı anlatalım" diyerek numaraya yönlendir.
- Kontenjan rakamlarını ASLA uydurma; sadece tarih_kontrol sonucunu ya da aşağıdaki kalan yer listesini kullan.
- Sorulmadıkça bot olduğunu söyleme; "bot musun" diye sorulursa dürüst ol: "İlk bilgileri hızlı iletebilmek için asistanımızla yazıyoruz, detayları ekibimiz telefonda anlatacak."
- Şikâyet, iptal, ödeme sorunu, alakasız konu → kibarca "ekibimiz size hemen dönecek" de ve devret=true yap.
- Müşteri numara vermek istemiyorsa ısrar etme; "Buradan da yardımcı olurum, fiyat listemiz: https://redmediadugun.com/redmedia-2027-fiyat-listesi.pdf" gibi yardımcı ol.

BİLGİLER:
${FACTS}

Cevabını MUTLAKA yanit_ver aracıyla ver.`;

/** Mesajdaki Türkiye cep numarasını bul */
export function findPhone(text: string): string | null {
  const m = text.replace(/[()\-.\s]/g, "").match(/(\+?90|0)?5\d{9}/);
  return m ? normalizePhone(m[0]) : null;
}


async function replyThread(igsid: string): Promise<void> {
  const auto = await readAutomation();
  const t0 = await withThreads(async (m) => ({ out: m[igsid] }));
  if (!t0 || t0.messages.at(-1)?.dir !== "in") return;
  if (t0.ownerUntil && Date.parse(t0.ownerUntil) > Date.now()) return;
  const isTest = !!t0.test;
  if (auto.igAiMode === "off" || (auto.igAiMode === "test" && !isTest)) return;
  // günde en fazla 15 otomatik cevap (döngü / kötüye kullanım koruması)
  const today = new Date().toDateString();
  if (t0.messages.filter((x) => x.by === "ai" && new Date(x.at).toDateString() === today).length >= 15) return;

  // Numara yazdıysa yakala
  const lastIns = t0.messages.slice(-4).filter((x) => x.dir === "in").map((x) => x.text).join(" ");
  const newPhone = !t0.phone ? findPhone(lastIns) : null;
  let t = t0;
  if (newPhone) t = await patchThread(igsid, (x) => ({ ...x, phone: newPhone }));

  const r = await generate(t);
  if (r.date) t = await patchThread(igsid, (x) => ({ ...x, weddingDate: r.date }));
  if (r.text) {
    const s = await sendIgMessage(igsid, r.text);
    if (s.ok) await patchThread(igsid, (x) => ({ ...x, messages: [...x.messages, { at: new Date().toISOString(), dir: "out" as const, text: r.text!, by: "ai" as const }] }));
    else await sendTelegramMessage(`⚠️ Instagram DM cevabı GİDEMEDİ (@${t.username ?? igsid}): ${s.error}\nMüşteri: ${lastIns.slice(0, 300)}`).catch(() => false);
  }

  const who = `@${t.username ?? "?"}${t.name ? ` (${t.name})` : ""}`;
  if (newPhone) await onPhoneCaptured(t, newPhone, isTest);
  else if (r.handoff) await sendTelegramMessage(`👤 INSTAGRAM — SİZ DÖNÜN: ${who}\n💬 ${lastIns.slice(0, 400)}${r.text ? `\n🤖 Giden: ${r.text}` : ""}`).catch(() => false);
  else if (isTest) await sendTelegramMessage(`🧪 IG TEST ${who}\n💬 ${lastIns.slice(0, 300)}\n🤖 ${r.text ?? "(cevap yok)"}`).catch(() => false);
}

async function onPhoneCaptured(t: IgThread, phone: string, isTest: boolean) {
  const who = `@${t.username ?? "?"}${t.name ? ` (${t.name})` : ""}`;
  const convo = t.messages.slice(-8).map((m) => `${m.dir === "in" ? "👤" : "🤖"} ${m.text.slice(0, 160)}`).join("\n");
  if (isTest) {
    await sendTelegramMessage(`🧪 IG TEST — NUMARA ALINDI: ${displayPhone(phone)} ${who}${t.weddingDate ? ` · düğün ${t.weddingDate}` : ""}\n(Test modu: panele eklenmedi, aranmayacak. Gerçek modda panele eklenip sesli asistan arayacaktı.)\n\n${convo}`).catch(() => false);
    return;
  }
  const r = await ingestCouple({
    name: t.name || (t.username ? `@${t.username}` : "Instagram çifti"),
    phone,
    weddingDate: t.weddingDate,
    source: "meta_form",
    sourceRef: `igdm:${t.igsid}`,
    note: `Instagram DM${t.username ? ` (@${t.username})` : ""}: ${t.messages.filter((m) => m.dir === "in").map((m) => m.text).join(" / ").slice(0, 600)}`,
  });
  if (r.ok) await patchThread(t.igsid, (x) => ({ ...x, coupleId: r.couple.id }));
  await sendTelegramMessage(
    r.ok
      ? `📸 INSTAGRAM DM'DEN YENİ ÇİFT: ${r.couple.name} - ${displayPhone(phone)}${t.weddingDate ? ` - Düğün: ${t.weddingDate}` : ""}\n${r.couple.contactLocked ? "🚫 Kara listede — aranmayacak." : r.created ? "➡️ Panele eklendi; sesli asistan arayacak, ardından WhatsApp." : "ℹ️ Bu numara panelde zaten vardı."}\n\n${convo}`
      : `⚠️ Instagram DM'den numara geldi ama panele eklenemedi: ${displayPhone(phone)} ${who} (${r.error})`,
  ).catch(() => false);
}

type Gen = { text?: string; date?: string; handoff?: boolean };

async function generate(t: IgThread): Promise<Gen> {
  const { anthropicKey } = await readIntegrations();
  if (!anthropicKey) return { handoff: true };
  const cfg = await readCapacityConfig();
  const months = await upcomingCapacity(14, cfg);
  const kontenjan = months.map((m) => `${m.monthLabel}: ${m.remaining <= 0 ? "DOLDU" : `${m.remaining}/${m.total}`}`).join(" | ");
  const today = new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const state = `# DURUM
- Bugün: ${today}
- Instagram adı: ${t.name ?? "bilinmiyor"} (kullanıcı adı @${t.username ?? "?"})
- Düğün tarihi: ${t.weddingDate ?? "henüz öğrenilmedi"}
- Telefon numarası: ${t.phone ? `ALINDI (${displayPhone(t.phone)}) — artık isteme, teşekkür et` : "henüz alınmadı"}
- Kalan yer (ay: kalan/toplam): ${kontenjan}`;
  const convo = t.messages.slice(-20).map((m) => `${m.dir === "in" ? "MÜŞTERİ" : m.by === "owner" ? "EKİP (insan)" : "BİZ"}: ${m.text.replace(/\s+/g, " ").slice(0, 600)}`).join("\n");
  const tools = [
    { name: "tarih_kontrol", description: "Bir düğün tarihinin müsaitliğini ve o ayın kalan yerini getirir.", input_schema: { type: "object", properties: { date: { type: "string", description: "YYYY-AA-GG" } }, required: ["date"] } },
    {
      name: "yanit_ver",
      description: "Müşteriye gidecek Instagram DM cevabı.",
      input_schema: {
        type: "object",
        properties: {
          text: { type: "string", description: "Müşteriye gidecek kısa mesaj" },
          dugun_tarihi: { type: "string", description: "Müşteri tarih söylediyse YYYY-AA-GG (yıl yoksa en yakın gelecek yıl)" },
          devret: { type: "boolean", description: "Şikâyet / ödeme / alakasız konu → sahibine haber ver" },
        },
        required: ["text"],
      },
    },
  ];
  const system = [{ type: "text", text: PROMPT, cache_control: { type: "ephemeral" } }, { type: "text", text: state }];
  const messages: { role: "user" | "assistant"; content: unknown }[] = [{ role: "user", content: `Instagram DM yazışması (eskiden yeniye):\n${convo}\n\nMüşterinin son mesajına cevabını yanit_ver ile ver.` }];
  for (let i = 0; i < 4; i++) {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": anthropicKey, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4000, output_config: { effort: "low" }, system, tools, messages }),
      signal: AbortSignal.timeout(60_000),
    }).catch(() => null);
    if (!res?.ok) return { handoff: true };
    const j = (await res.json()) as { content?: { type: string; id?: string; name?: string; input?: Record<string, unknown> }[] };
    const blocks = j.content ?? [];
    const final = blocks.find((b) => b.type === "tool_use" && b.name === "yanit_ver");
    const checks = blocks.filter((b) => b.type === "tool_use" && b.name === "tarih_kontrol");
    if (final && !checks.length) {
      const inp = final.input ?? {};
      const text = typeof inp.text === "string" ? inp.text.trim().slice(0, 900) : "";
      const d = typeof inp.dugun_tarihi === "string" && /^\d{4}-\d{2}-\d{2}$/.test(inp.dugun_tarihi) ? inp.dugun_tarihi : undefined;
      return { text: text || undefined, date: d, handoff: inp.devret === true };
    }
    if (!checks.length) return { handoff: true };
    messages.push({ role: "assistant", content: blocks });
    const results: unknown[] = [];
    for (const c of checks) {
      const d = String(c.input?.date ?? "");
      const r = /^\d{4}-\d{2}-\d{2}$/.test(d) ? await checkDate(d, cfg).catch(() => null) : null;
      results.push({ type: "tool_result", tool_use_id: c.id, content: r ? JSON.stringify({ tarih: r.dateLabel, musait: r.available, ay_kalan: r.month.remaining, ay_toplam: r.month.total, alternatifler: r.alternatives.map((a) => a.dateLabel) }) : "Tarih anlaşılamadı — müşteriye gün/ay/yıl olarak sor" });
    }
    if (final) results.push({ type: "tool_result", tool_use_id: final.id, content: "Önce tarih sonucuna bak, sonra yanit_ver ile yeniden cevap ver." });
    messages.push({ role: "user", content: results });
  }
  return { handoff: true };
}

