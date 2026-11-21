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
import { randomUUID } from "crypto";
import { cleanName, findCoupleByPhone, getCouple, ingestCouple, mutateCouple } from "@/lib/ai-couples/store";
import { historyForAgent } from "@/lib/ai-couples/journey";
import type { AiCouple, AiMessageRecord } from "@/types/ai-couples";
import { normalizePhone, displayPhone } from "@/lib/ai-couples/rules";
import { parseCallbackTime } from "@/lib/ai-couples/callback-time";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { FACTS, generateWaOpener } from "@/lib/ai-couples/wa-agent";
import { cancelPendingDrafts, createDraftAndNotify, createIgDraftAndNotify, draftTexts, hasPendingDraft, normDraftText } from "@/lib/ai-couples/wa-drafts";

const FILE = dataPath("ai-ig-threads.json");
const MODEL = "claude-sonnet-5-5";
const G = "https://graph.facebook.com/v21.0";
export const CALL_NUMBER = "0312 963 23 47";

export const IG_STAGES = {
  ilk_temas: "İlk mesaj geldi",
  tarih_soruldu: "Çekim tarihi soruldu",
  tarih_alindi: "Tarih öğrenildi",
  firsat_anlatildi: "Fırsat anlatıldı",
  numara_istendi: "Numara istendi",
  numara_alindi: "Numara alındı",
  arama_saati_alindi: "Arama saati alındı",
  numara_vermedi: "Numara vermek istemedi — DM'den devam",
  fiyat_istedi: "Fiyat / teklif istedi",
  fiyat_verildi: "Fiyat / teklif verildi",
  kapora_konusuldu: "Kapora / tarih tutma konuşuldu",
  ilgilenmiyor: "İlgilenmiyor",
  devredildi: "Size devredildi",
} as const;
export type IgStage = keyof typeof IG_STAGES;

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
  /** Paneldeki çifte kaç mesaj aktarıldı (ortak geçmiş: sesli asistan + WhatsApp da görsün) */
  synced?: number;
  /** Müşterinin aranmak istediği saat (ISO) — sesli asistan o saatte arar */
  callAt?: string;
  /** Müşteri WhatsApp'tan yazılmasını istedi (arama saati sorulmaz) */
  prefersWa?: boolean;
  /** WhatsApp ilk mesaj önerisi hazırlandı mı */
  waOpenerAt?: string;
  /** Konuşmanın son aşaması + 1 cümlelik gidişat özeti (panel ve Telegram için) */
  stage?: IgStage;
  summary?: string;
  createdAt: string;
  updatedAt: string;
};

/* ---------------- ortak geçmiş: Instagram ↔ paneldeki çift ---------------- */

/** Sohbet bir çifte bağlıysa, henüz aktarılmamış Instagram mesajlarını çiftin geçmişine yaz */
async function syncToCouple(igsid: string): Promise<void> {
  const t = await withThreads(async (m) => ({ out: m[igsid] }));
  if (!t?.coupleId) return;
  const from = t.synced ?? 0;
  const fresh = t.messages.slice(from);
  if (!fresh.length) return;
  await mutateCouple(t.coupleId, (c) => {
    const have = new Set(c.messages.filter((m) => m.channel === "instagram").map((m) => `${m.at}|${m.text}`));
    const add: AiMessageRecord[] = fresh
      .filter((m) => !have.has(`${m.at}|${m.text}`))
      .map((m) => ({ id: randomUUID(), at: m.at, channel: "instagram" as const, direction: m.dir, kind: m.dir === "in" ? ("reply" as const) : m.by === "owner" ? ("reply" as const) : ("ai" as const), text: m.text }));
    if (!add.length) return c;
    return { ...c, messages: [...c.messages, ...add].sort((a, b) => a.at.localeCompare(b.at)), updatedAt: new Date().toISOString() };
  }).catch(() => null);
  await patchThread(igsid, (x) => ({ ...x, synced: x.messages.length }));
}

/** Numarası bilinen sohbeti paneldeki çifte bağla (varsa) */
async function linkByPhone(igsid: string, phone: string): Promise<AiCouple | undefined> {
  const c = await findCoupleByPhone(phone);
  if (!c) return undefined;
  await patchThread(igsid, (x) => ({ ...x, coupleId: c.id, weddingDate: x.weddingDate ?? c.weddingDate }));
  await syncToCouple(igsid);
  return c;
}

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
  return { username: j?.username?.toLowerCase(), name: j?.name ? cleanName(j.name) || undefined : undefined };
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
  if (t.coupleId) await syncToCouple(igsid);
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
  // Onaylanıp gönderilen öneri de yankı olarak döner (app_id her zaman gelmiyor) → metni bir öneriyle aynıysa SAHİBİNİN yazısı değildir
  if ((await draftTexts().catch(() => new Set<string>())).has(normDraftText(text))) return;
  await patchThread(igsid, (x) => ({ ...x, ownerUntil: new Date(Date.now() + 12 * 3600_000).toISOString(), messages: [...x.messages, { at, dir: "out" as const, text: text.slice(0, 2000), by: "owner" as const }] }));
  await syncToCouple(igsid);
}

/* ---------------- cevap ---------------- */

const PROMPT = `Sen RED MEDIA'nın (Ankara, düğün fotoğrafı ve sinematik video) Instagram hesabında DM'lere cevap veren, güler yüzlü ve işini bilen bir ekip üyesisin. Çiftler genelde reklamı görüp yazıyor.

TEK AMACIN: Çifti sıcak karşılamak ve ${CALL_NUMBER} numaralı hattımızdan aranmak üzere TELEFON NUMARASINI almak. Detaylı bilgi ve çifte özel fiyat telefonda verilecek.

AKIŞ — her aşamada ZORUNLU olanlar (bunları atlama):
1) İLK CEVAP: "Merhabalar, öncelikle hayırlı olsun 🤍" + (müşteri bir şey sorduysa kısa cevap) + ÇEKİM TARİHİNİ sor ("Çekim yaptırmak istediğiniz tarihi öğrenebilir miyim?"). Fiyat sorduysa paketleri fiyat düşüşüyle kısaca ver (aşağıdaki FİYAT SÖYLEME kuralı) ve yine tarihi sor.
2) TARİH GELİNCE (ya da "belli değil" derse) — bu mesajda ŞUNLARIN HEPSİ olacak, kısa ve akıcı 2-3 cümlede:
   a) Tarih verdiyse tarih_kontrol ile bak; kalan yer 5 ve altındaysa "Her ay sadece 10 çift alıyoruz, [ay] için X yer kaldı" (GERÇEK sayı); daha fazlaysa sayı verme, "Her ay sadece 10 çift alıyoruz, kampanya yerleri sınırlı" de. Tarih yoksa: "Her ay sadece 10 çift alıyoruz, çoğu ayda son 3-4 yer kaldı".
   b) "Bu son yerlerden ayırtanlara dış çekimde drone çekimi hediye, üstelik fiyatlarımıza %40 zam henüz yansımadı."
   c) NUMARA iste: "Size özel fiyatı ve detayları anlatalım, WhatsApp / telefon numaranızı yazar mısınız? ${CALL_NUMBER}'den dönelim."
3) NUMARA GELİNCE: teşekkür et; müşteri WhatsApp istediyse saat SORMA, "Tamamdır, birazdan WhatsApp'tan yazıyoruz 🤍" de; istemediyse ve arama saati bilinmiyorsa "Sizi hangi saatte aramamız uygun olur?" diye sor; biliniyorsa onayla. Numara alındıktan sonra bir daha numara isteme.
4) MÜŞTERİ "WhatsApp'tan yazayım / WhatsApp'tan konuşalım / numaranızı verin / WhatsApp numaranız ne" derse: HEMEN onun numarasını iste — "Tabii 😊 Numaranızı yazarsanız fiyat listesini ve detayları hemen WhatsApp'tan atalım" (bizim numaramızı verip bekleme; onun numarasını al). Numara gelince "Tamamdır, birazdan WhatsApp'tan yazıyoruz 🤍" de.
5) NUMARA VERMEK İSTEMEZSE ya da "buradan devam edelim" derse: sorun değil, DM'den satışa devam et — fiyatları düşüşüyle ver, fiyat listesini at (https://redmediadugun.com/redmedia-2027-fiyat-listesi.pdf), tarihi kontrol et, kaporayla tarihi tutmayı teklif et. Numarayı bir daha isteme (en fazla çok sonra bir kez "isterseniz 2 dakikada telefonda anlatalım").

FİYAT SÖYLEME (her fiyat verdiğinde ZORUNLU): Fiyatı her zaman normal fiyattan kampanya fiyatına DÜŞÜŞLE ver: "Fotoğraf + klip normalde 12.600, kampanyada 9.000 TL", "Fotoğraf normalde 7.000, şu an 5.000 TL", "Fotoğraf + klip + albüm normalde 19.600, şu an 14.000 TL". Ardından AYNI ya da bir sonraki mesajda, müşterinin isteğine uyan TEK bir ek hizmeti indirimiyle öner: "Gelin almayı da eklerseniz 5.000 yerine 4.000 TL'ye düşüyor, bence değerlendirin" (seçenekler: gelin alma klibi/fotoğraf, kuaför hazırlık, salona giriş ve ilk dans, albüm seti, after'a kadar çekim, omuz kamera — fiyatlar bilgilerdeki listeden). Müşteri "sadece dış çekim / istemiyoruz" derse ek hizmeti bir daha açma.

HAFIZA: Konuşmanın tamamını oku. Daha önce selamlaştıysanız müşteri tekrar "merhaba" yazsa bile baştan karşılama yapma, tekrar "hayırlı olsun" deme, aynı soruları tekrar sorma. Kısa "Buyrun 😊" ya da "Merhabalar tekrar" de ve KALDIĞIN YERDEN devam et (aşağıdaki aşamaya göre). Müşterinin daha önce verdiği bilgiyi (tarih, isim, numara) tekrar isteme.

ÜSLUP — EN ÖNEMLİ KISIM (yapay zekâ olduğu ASLA belli olmayacak):
- Ankara'da düğün çekimi yapan, DM'lere telefondan kendisi cevap veren samimi bir esnaf gibi yaz. Sıcak, içten, biraz da heyecanlı. Kısa: genelde 1-2 cümle, en fazla 3.
- Yeri geldiğinde emoji kullan (🤍 😊 🙏 📸 ✨ gibi, mesajda 1-2 tane) — ama her cümleye değil.
- ASLA yazma: "Harika bir soru", "Size yardımcı olmaktan mutluluk duyarım", "Elbette!", "Memnuniyetle", "Değerli", "tarafınıza", "bilgilendirmek isteriz", "Herhangi bir sorunuz olursa çekinmeden", madde işaretli liste, başlık, uzun açıklama. Bunlar robot gibi durur.
- Konuşur gibi yaz: "Merhabalar hayırlı olsun 🤍", "Çok güzel, hemen bakıyorum", "Temmuz baya doldu açıkçası", "Kaçırmayın derim", "Hemen arayalım isterseniz, 2 dakikada anlatırız 😊". Bazen cümleye "Valla", "Açıkçası", "Şöyle söyleyeyim" gibi doğal girişler.
- Aciliyet hissettir ama gerçekçi ol: zam (henüz %40 yansımadı, yakında güncellenecek), ayda 10 çift sınırı, o ayın GERÇEK kalan yeri. Uydurma "az önce 3 çift yazdı" gibi şeyler YAZMA.
- Her mesajın sonunda müşteriyi bir sonraki adıma götür (tarih, numara ya da tarihi tutma) — ama aynı soruyu art arda tekrarlama.

KURALLAR:
- Fiyat sorulursa: net fiyatı söyle (aşağıdaki bilgilerden, uydurmadan) + "erken rezervasyonda bu fiyattan sabitliyoruz, zam gelmeden" diye harekete geçir + numara henüz alınmadıysa "detaylı anlatalım, numaranızı yazar mısınız" ekle.
- Kontenjan rakamlarını ASLA uydurma; sadece tarih_kontrol sonucunu ya da aşağıdaki kalan yer listesini kullan.
- Sorulmadıkça bot olduğunu söyleme; "bot musun" diye açıkça sorulursa dürüst ol: "İlk bilgileri hızlı iletebilmek için asistanımızla yazıyoruz, detayları ekibimiz anlatacak 😊".
- Şikâyet, iptal, ödeme sorunu, alakasız konu → kibarca "hemen ilgileniyoruz" de ve devret=true yap.

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

  // Aranmak istediği saati yakala ("akşam 7 gibi", "yarın öğlen") — numara yazılan mesajdaki rakamlar saat sanılmasın
  // "WhatsApp'tan yazın" → WhatsApp tercihi (saat sorulmaz, WhatsApp'tan ilk mesaj hazırlanır)
  const recentIn = t.messages.slice(-3).filter((x) => x.dir === "in").map((x) => x.text).join(" ");
  if (!t.prefersWa && /(whats?app|watsap|vatsap|\bwp\b|wp'?(den|ten|dan|tan))/i.test(recentIn) && !/(aray[ıi]n|arayabilirsiniz|arar m[ıi]s[ıi]n[ıi]z)/i.test(recentIn)) {
    t = await patchThread(igsid, (x) => ({ ...x, prefersWa: true }));
  }
  let newCallAt: string | null = null;
  if (t.phone && !t.callAt && !t.prefersWa) {
    const recent = t.messages.slice(-3).filter((x) => x.dir === "in").map((x) => x.text).join(" ").replace(/(\+?90|0)?\s*5\d{2}[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/g, " ");
    const when = parseCallbackTime(recent, new Date());
    if (when && when.getTime() > Date.now() + 5 * 60_000 && when.getTime() < Date.now() + 14 * 86400_000) {
      newCallAt = when.toISOString();
      t = await patchThread(igsid, (x) => ({ ...x, callAt: newCallAt! }));
    }
  }

  const r = await generate(t);
  if (r.date) t = await patchThread(igsid, (x) => ({ ...x, weddingDate: r.date }));
  if (r.stage || r.summary || r.handoff) t = await patchThread(igsid, (x) => ({ ...x, stage: r.handoff ? "devredildi" : r.stage ?? x.stage, summary: r.summary ?? x.summary }));
  const who = `@${t.username ?? "?"}${t.name ? ` (${t.name})` : ""}`;
  if (newPhone) await onPhoneCaptured(t, newPhone, isTest);
  if (newCallAt) await applyCallTime(igsid, newCallAt, isTest);
  // Numara elimizdeyse WhatsApp'tan ilk mesaj (teklif) önerisi — bir kez
  const tw = await withThreads(async (m) => ({ out: m[igsid] }));
  if (tw?.phone && !tw.waOpenerAt) await sendWaOpener(igsid, isTest);

  // HİÇBİR CEVAP KENDİLİĞİNDEN GİTMEZ: Telegram'a "✅ Gönder" düğmesiyle öneri olarak gider, sahibi onaylarsa gönderilir
  const lastIn = t.messages.filter((x) => x.dir === "in").slice(-3).map((x) => x.text).join(" / ");
  if (r.text) {
    const tg =
      `📸 INSTAGRAM CEVAP ÖNERİSİ${isTest ? " (TEST)" : ""} — ${who}${r.handoff ? "\n⚠️ Dikkat: bu konuya sizin bakmanız iyi olur" : ""}${t.stage ? `\n📍 ${IG_STAGES[t.stage]}${t.summary ? ` — ${t.summary}` : ""}` : ""}\n\n` +
      `💬 Müşteri: ${lastIn.slice(0, 500)}\n\n🤖 Önerdiğim cevap:\n${r.text}`;
    const ok = await createIgDraftAndNotify({ igsid, name: who, text: r.text, tg }).catch(() => false);
    if (!ok) await sendTelegramMessage(`${tg}\n\n(Düğme eklenemedi — beğendiyseniz kopyalayıp Instagram'dan gönderin.)`).catch(() => false);
  } else {
    await sendTelegramMessage(`👤 INSTAGRAM — SİZ DÖNÜN: ${who}\n💬 ${lastIn.slice(0, 500)}\n(Asistan cevap öneremedi.)`).catch(() => false);
  }
}

/** Müşterinin istediği arama saatini paneldeki çifte yaz → sesli asistan o saat gelmeden aramaz, gelince arar */
async function applyCallTime(igsid: string, callAt: string, isTest: boolean): Promise<void> {
  await patchThread(igsid, (x) => ({ ...x, stage: "arama_saati_alindi" }));
  const t = await withThreads(async (m) => ({ out: m[igsid] }));
  if (!t) return;
  const label = new Date(callAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  const who = `@${t.username ?? "?"}${t.name ? ` (${t.name})` : ""}`;
  if (isTest || !t.coupleId) {
    await sendTelegramMessage(`🧪 IG TEST — ARAMA SAATİ: ${label} ${who}\n(Test modu: arama kurulmadı. Gerçek modda sesli asistan bu saatte arayacaktı.)`).catch(() => false);
    return;
  }
  const now = new Date().toISOString();
  await mutateCouple(t.coupleId, (c) =>
    c.contactLocked || c.status === "won" || c.status === "lost"
      ? c
      : {
          ...c,
          callbackRequested: true,
          callbackAt: callAt,
          busyRetries: 0,
          timeline: [...c.timeline, { at: now, type: "callback", text: `Tekrar arama zamanı: ${label} (Instagram DM'den saat verdi)` }],
          updatedAt: now,
        },
  ).catch(() => null);
  await sendTelegramMessage(`⏰ Instagram'dan gelen ${t.name || who} ${label} civarında aranmak istedi — sesli asistan o saatte arayacak.`).catch(() => false);
}

/** Sahibi Telegram'dan "Gönder"e bastı → kontrol et ve Instagram'dan gönder */
export async function approveIgSend(igsid: string, text: string, draftAt: string): Promise<{ ok: boolean; msg: string }> {
  const t = await withThreads(async (m) => ({ out: m[igsid] }));
  if (!t) return { ok: false, msg: "Sohbet bulunamadı." };
  // Sahibi bu öneriden sonra Instagram'dan kendisi yazdıysa çift mesaj olmasın
  if (t.messages.some((m) => m.dir === "out" && Date.parse(m.at) > Date.parse(draftAt))) return { ok: false, msg: "Bu öneriden sonra müşteriye zaten mesaj gitmiş — çift mesaj olmasın diye göndermedim." };
  // Instagram kuralı: müşterinin son mesajından sonraki 24 saat içinde cevap verilebilir
  const lastIn = [...t.messages].reverse().find((m) => m.dir === "in");
  if (lastIn && Date.now() - Date.parse(lastIn.at) > 23.5 * 3600_000) return { ok: false, msg: "Müşterinin son mesajının üzerinden 24 saat geçti; Instagram artık otomatik mesaja izin vermiyor. Kendiniz yazabilirsiniz." };
  const s = await sendIgMessage(igsid, text);
  if (!s.ok) return { ok: false, msg: `⚠️ Gönderilemedi (${s.error}). Tekrar basabilir ya da Instagram'dan kendiniz yazabilirsiniz.` };
  await patchThread(igsid, (x) => ({ ...x, messages: [...x.messages, { at: new Date().toISOString(), dir: "out" as const, text, by: "ai" as const }] }));
  await syncToCouple(igsid);
  return { ok: true, msg: "" };
}

async function onPhoneCaptured(t: IgThread, phone: string, isTest: boolean) {
  await patchThread(t.igsid, (x) => ({ ...x, stage: x.callAt ? "arama_saati_alindi" : "numara_alindi" }));
  const who = `@${t.username ?? "?"}${t.name ? ` (${t.name})` : ""}`;
  const convo = t.messages.slice(-8).map((m) => `${m.dir === "in" ? "👤" : "🤖"} ${m.text.slice(0, 160)}`).join("\n");
  if (isTest) {
    // Test: yeni çift açılmaz, aranmaz; ama numara panelde varsa o kayda bağlanır (ortak hafıza testi)
    const linked = await linkByPhone(t.igsid, phone);
    await sendTelegramMessage(`🧪 IG TEST — NUMARA ALINDI: ${displayPhone(phone)} ${who}${t.weddingDate ? ` · düğün ${t.weddingDate}` : ""}\n(Test modu: yeni kayıt açılmadı, aranmayacak.${linked ? ` Bu numara panelde "${linked.name}" olarak var — Instagram yazışması onun geçmişine eklendi, asistanlar artık bunu da biliyor.` : ""})\n\n${convo}`).catch(() => false);
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
  if (r.ok) {
    await patchThread(t.igsid, (x) => ({ ...x, coupleId: r.couple.id }));
    await syncToCouple(t.igsid); // Instagram yazışması çiftin geçmişine → sesli asistan aradığında bunu bilir
    if (r.created) {
      // Standart "talebiniz ulaştı, arayacağız" karşılaması gitmesin (ilk WhatsApp mesajını asistan hazırlıyor, siz onaylıyorsunuz).
      // WhatsApp istemediyse sesli asistan arar (saat verdiyse o saatte); WhatsApp istediyse aranmaz — cevap vermezse 3. gün takip araması.
      const fresh = await withThreads(async (m) => ({ out: m[t.igsid] }));
      const now = new Date().toISOString();
      await mutateCouple(r.couple.id, (c) => ({
        ...c,
        status: c.status === "new" ? "contacted" : c.status,
        ...(fresh?.prefersWa ? {} : { callbackRequested: true, callbackAt: fresh?.callAt ?? now }),
        updatedAt: now,
      })).catch(() => null);
    }
  }
  await sendTelegramMessage(
    r.ok
      ? `📸 INSTAGRAM DM'DEN YENİ ÇİFT: ${r.couple.name} - ${displayPhone(phone)}${t.weddingDate ? ` - Düğün: ${t.weddingDate}` : ""}\n${r.couple.contactLocked ? "🚫 Kara listede — aranmayacak." : r.created ? (t.prefersWa ? "➡️ Panele eklendi. WhatsApp'tan yazılmasını istedi — ilk WhatsApp mesajı önerisi birazdan gelecek (aranmayacak; cevap vermezse 3. gün takip araması)." : "➡️ Panele eklendi; sesli asistan arayacak + ilk WhatsApp mesajı önerisi birazdan gelecek.") : "ℹ️ Bu numara panelde zaten vardı."}\n\n${convo}`
      : `⚠️ Instagram DM'den numara geldi ama panele eklenemedi: ${displayPhone(phone)} ${who} (${r.error})`,
  ).catch(() => false);
}

type Gen = { text?: string; date?: string; handoff?: boolean; stage?: IgStage; summary?: string };

async function generate(t: IgThread): Promise<Gen> {
  const { anthropicKey } = await readIntegrations();
  if (!anthropicKey) return { handoff: true };
  const cfg = await readCapacityConfig();
  const months = await upcomingCapacity(14, cfg);
  const kontenjan = months.map((m) => `${m.monthLabel}: ${m.remaining <= 0 ? "DOLDU" : `${m.remaining}/${m.total}`}`).join(" | ");
  const today = new Date().toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", year: "numeric" });
  // Bu kişi panelde varsa: telefon görüşmeleri + WhatsApp yazışmaları (aynı müşteriyi her kanalda tanı)
  const couple = t.coupleId ? await getCouple(t.coupleId).catch(() => undefined) : undefined;
  const waLast = couple
    ? couple.messages
        .filter((m) => m.channel === "whatsapp" && !m.text.startsWith("["))
        .slice(-6)
        .map((m) => `${m.direction === "in" ? "Müşteri" : "Biz"}: ${m.text.replace(/\s+/g, " ").slice(0, 160)}`)
        .join(" | ")
    : "";
  const known = couple
    ? `\n- BU MÜŞTERİYİ TANIYORUZ (panelde: ${couple.name}${couple.weddingDate ? `, düğün ${couple.weddingDate}` : ""}). Telefon/WhatsApp geçmişi: ${historyForAgent(couple)}\n  Son WhatsApp yazışması: ${waLast || "yok"}\n  → Bunları bildiğini doğal şekilde belli et ("geçen gün konuşmuştuk" gibi); aynı şeyleri baştan sorma/anlatma, daha önce söylenenle çelişme.`
    : "";
  const state = `# DURUM
- Bugün: ${today}
- Instagram adı: ${t.name ?? "bilinmiyor"} (kullanıcı adı @${t.username ?? "?"})
- Düğün tarihi: ${t.weddingDate ?? "henüz öğrenilmedi"}
- Telefon numarası: ${t.phone ? `ALINDI (${displayPhone(t.phone)}) — artık isteme, teşekkür et` : "henüz alınmadı"}
- İletişim tercihi: ${t.prefersWa ? "WHATSAPP — arama saati SORMA. Numara alındıysa: 'Tamamdır, birazdan WhatsApp'tan yazıyoruz 🤍' de; alınmadıysa numarasını iste." : "belirtmedi"}
- Arama saati: ${t.prefersWa ? "(WhatsApp istedi — sorma)" : ""}${!t.prefersWa && t.callAt ? `BELLİ — ${new Date(t.callAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} (onayla, tekrar sorma)` : !t.prefersWa && t.phone ? "henüz bilinmiyor — bir kez sor" : t.prefersWa ? "" : "-"}
- Kalan yer (ay: kalan/toplam): ${kontenjan}${known}
- Konuşmanın şu anki aşaması: ${t.stage ? IG_STAGES[t.stage] : "yeni"}${t.summary ? ` — ${t.summary}` : ""}
- Daha önce selamlaştık mı: ${t.messages.some((m) => m.dir === "out") ? "EVET — tekrar 'merhaba/hayırlı olsun' ile baştan BAŞLAMA, kaldığın yerden devam et" : "hayır, bu ilk cevap"}`;
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
          evre: { type: "string", enum: Object.keys(IG_STAGES), description: "Bu cevaptan SONRA konuşmanın geldiği aşama" },
          ozet: { type: "string", description: "Sahibi için gidişatın TEK cümlelik özeti (baştan anlatma; şu an nerede: ne istedi, ne verildi, sırada ne var). Örn: 'Temmuz 2027 için yazdı, fiyat verildi, numara vermedi, DM'den devam ediyor.'" },
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
      const stage = typeof inp.evre === "string" && inp.evre in IG_STAGES ? (inp.evre as IgStage) : undefined;
      const summary = typeof inp.ozet === "string" ? inp.ozet.replace(/\s+/g, " ").trim().slice(0, 240) : undefined;
      return { text: text || undefined, date: d, handoff: inp.devret === true, stage, summary };
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


/** Panel / kontrol: sohbetlerin kısa durumu (konuşmanın tamamı değil, gidişat) */
export async function threadsOverview(limit = 60) {
  const list = await listThreads();
  return list.slice(0, limit).map((t) => {
    const lastIn = [...t.messages].reverse().find((m) => m.dir === "in");
    const lastOut = [...t.messages].reverse().find((m) => m.dir === "out");
    return {
      igsid: t.igsid,
      name: t.name ?? null,
      username: t.username ?? null,
      stage: t.stage ?? (t.messages.some((m) => m.dir === "out") ? null : "ilk_temas"),
      stageLabel: t.stage ? IG_STAGES[t.stage] : t.messages.some((m) => m.dir === "out") ? "Konuşuluyor" : IG_STAGES.ilk_temas,
      summary: t.summary ?? null,
      phone: t.phone ? displayPhone(t.phone) : null,
      callAt: t.callAt ?? null,
      weddingDate: t.weddingDate ?? null,
      coupleId: t.coupleId ?? null,
      test: Boolean(t.test),
      waitingUs: t.messages.at(-1)?.dir === "in",
      ownerPaused: Boolean(t.ownerUntil && Date.parse(t.ownerUntil) > Date.now()),
      lastIn: lastIn ? { at: lastIn.at, text: lastIn.text.slice(0, 140) } : null,
      lastOut: lastOut ? { at: lastOut.at, text: lastOut.text.slice(0, 140), by: lastOut.by ?? null } : null,
      messageCount: t.messages.length,
      updatedAt: t.updatedAt,
    };
  });
}

/** Sahibi beklemesini kaldır (yanlışlıkla "sahibi yazdı" sanılan yankılar silinir) */
export async function resumeThread(igsid: string): Promise<boolean> {
  const drafts = await draftTexts().catch(() => new Set<string>());
  const t = await withThreads(async (m) => ({ out: m[igsid] }));
  if (!t) return false;
  await patchThread(igsid, (x) => ({
    ...x,
    ownerUntil: undefined,
    messages: x.messages.filter((m, i, arr) => !(m.by === "owner" && drafts.has(normDraftText(m.text)) && arr.some((o) => o.by === "ai" && normDraftText(o.text) === normDraftText(m.text)))).map((m) => (m.by === "owner" && drafts.has(normDraftText(m.text)) ? { ...m, by: "ai" as const } : m)),
  }));
  return true;
}

/** Cevap bekleyen sohbetlere (son 23 saat, henüz öneri gitmemiş) öneri hazırla — Telegram'a onaya gider */
export async function replyPending(): Promise<{ igsid: string; who: string }[]> {
  const list = await listThreads();
  const done: { igsid: string; who: string }[] = [];
  for (const t of list) {
    const last = t.messages.at(-1);
    if (!last || last.dir !== "in" || Date.now() - Date.parse(last.at) > 23 * 3600_000) continue;
    if (await hasPendingDraft(`ig:${t.igsid}`, last.at)) continue;
    await replyThread(t.igsid).catch((e) => console.error("[ig-agent] replyPending", e));
    done.push({ igsid: t.igsid, who: t.username ? `@${t.username}` : t.name ?? t.igsid });
  }
  return done;
}

/** Bekleyen öneriyi iptal edip yenisini hazırla (ör. öneri hatalıydı, kurallar düzeltildi) */
export async function redoThread(igsid: string): Promise<number> {
  const n = await cancelPendingDrafts(`ig:${igsid}`);
  await replyThread(igsid);
  return n;
}

/**
 * Meta'daki sohbet geçmişini içeri al (webhook kurulmadan önce gelen mesajlar / eski konuşma hafızası).
 * Var olan kayıtla birleştirir (aynı saat + metin tekrar eklenmez). Son mesaj müşteriden ve 23 saatten yeniyse öneri hazırlar.
 */
export async function importConversation(igsid: string, draft = true): Promise<{ added: number; username?: string; drafted: boolean }> {
  const { token, pageId } = await metaCfg();
  if (!token || !pageId) return { added: 0, drafted: false };
  const u = `${G}/${pageId}/conversations?platform=instagram&user_id=${igsid}&fields=participants,messages.limit(30){message,from,created_time}&access_token=${encodeURIComponent(token)}`;
  const j = (await (await fetch(u, { signal: AbortSignal.timeout(15000) })).json().catch(() => null)) as {
    data?: { participants?: { data?: { id: string; username?: string; name?: string }[] }; messages?: { data?: { message?: string; from?: { id?: string }; created_time?: string }[] } }[];
  } | null;
  const conv = j?.data?.[0];
  if (!conv) return { added: 0, drafted: false };
  const me = conv.participants?.data?.find((p) => p.id === igsid);
  const msgs: IgMsg[] = (conv.messages?.data ?? [])
    .filter((m) => m.created_time)
    .map((m) => ({ at: new Date(m.created_time!).toISOString(), dir: m.from?.id === igsid ? ("in" as const) : ("out" as const), text: (m.message || "[görsel / ek]").slice(0, 2000), ...(m.from?.id === igsid ? {} : { by: "owner" as const }) }));
  let added = 0;
  const t = await patchThread(igsid, (x) => {
    const have = new Set(x.messages.map((m) => `${m.dir}|${m.text}|${m.at.slice(0, 16)}`));
    const fresh = msgs.filter((m) => !have.has(`${m.dir}|${m.text}|${m.at.slice(0, 16)}`));
    added = fresh.length;
    return { ...x, username: x.username ?? me?.username?.toLowerCase(), name: x.name ?? (me?.name ? cleanName(me.name) || undefined : undefined), messages: [...x.messages, ...fresh].sort((a, b) => a.at.localeCompare(b.at)) };
  });
  if (!t.name) {
    const p = await fetchProfile(igsid);
    if (p.name || p.username) await patchThread(igsid, (x) => ({ ...x, name: x.name ?? p.name, username: x.username ?? p.username }));
  }
  if (t.coupleId) await syncToCouple(igsid);
  const last = t.messages.at(-1);
  let drafted = false;
  if (draft && last?.dir === "in" && Date.now() - Date.parse(last.at) < 23 * 3600_000 && !(await hasPendingDraft(`ig:${igsid}`, last.at))) {
    await replyThread(igsid);
    drafted = true;
  }
  return { added, username: t.username, drafted };
}

/** Deneme: verilen yazışmaya asistanın vereceği cevabı üret (HİÇBİR ŞEY göndermez, kaydetmez) */
export async function simulateIg(input: { messages: { dir: "in" | "out"; text: string }[]; name?: string; phone?: string; weddingDate?: string }): Promise<Gen> {
  const now = Date.now();
  const recentIn = input.messages.slice(-3).filter((m) => m.dir === "in").map((m) => m.text).join(" ");
  const prefersWa = /(whats?app|watsap|vatsap|wp|wp'?(den|ten|dan|tan))/i.test(recentIn) && !/(aray[ıi]n|arayabilirsiniz)/i.test(recentIn);
  const t: IgThread = {
    igsid: "sim",
    name: input.name,
    username: "deneme",
    phone: input.phone,
    weddingDate: input.weddingDate,
    prefersWa,
    messages: input.messages.map((m, i) => ({ at: new Date(now - (input.messages.length - i) * 60_000).toISOString(), dir: m.dir, text: m.text, ...(m.dir === "out" ? { by: "ai" as const } : {}) })),
    createdAt: new Date(now).toISOString(),
    updatedAt: new Date(now).toISOString(),
  };
  return generate(t);
}

/** Numarası alınan çifte WhatsApp'tan atılacak ilk mesajı hazırla → Telegram'a "✅ Gönder" düğmesiyle (sahibi onaylarsa gider) */
async function sendWaOpener(igsid: string, isTest: boolean): Promise<void> {
  const t = await withThreads(async (m) => ({ out: m[igsid] }));
  if (!t?.phone || t.waOpenerAt) return;
  await patchThread(igsid, (x) => ({ ...x, waOpenerAt: new Date().toISOString() }));
  const couple = t.coupleId ? await getCouple(t.coupleId).catch(() => undefined) : undefined;
  const who = t.name || (t.username ? `@${t.username}` : "Instagram çifti");
  if (!couple) {
    await sendTelegramMessage(`📲 ${who} numarasını verdi (${displayPhone(t.phone)}) ama panelde kaydı yok${isTest ? " (test modu)" : ""} — WhatsApp ilk mesajı hazırlanamadı.`).catch(() => false);
    return;
  }
  const ig = t.messages.slice(-10).map((m) => `${m.dir === "in" ? "Müşteri" : "Biz"}: ${m.text.replace(/\s+/g, " ").slice(0, 200)}`).join(" | ");
  const text = await generateWaOpener({ ...couple, weddingDate: couple.weddingDate ?? t.weddingDate }, ig);
  if (!text) {
    await sendTelegramMessage(`📲 ${who} (${displayPhone(t.phone)}) — WhatsApp ilk mesajı üretilemedi, lütfen siz yazın.`).catch(() => false);
    return;
  }
  const tg = `📲 WHATSAPP İLK MESAJ ÖNERİSİ${isTest ? " (TEST)" : ""} — ${couple.name} · ${displayPhone(couple.phone)}\n(Instagram'dan numarasını verdi${t.prefersWa ? ", WhatsApp'tan yazılmasını istedi" : ""})\n\n🤖 Önerdiğim mesaj:\n${text}`;
  const ok = await createDraftAndNotify({ coupleId: couple.id, text, tg }).catch(() => false);
  if (!ok) await sendTelegramMessage(`${tg}\n\n(Düğme eklenemedi — beğendiyseniz kopyalayıp WhatsApp'tan gönderin.)`).catch(() => false);
}

/** Elle: numarası alınmış sohbet için WhatsApp ilk mesaj önerisini şimdi hazırla (WhatsApp istediyse hemen aranmaz) */
export async function waOpenerNow(igsid: string, prefersWa: boolean): Promise<boolean> {
  const t = await patchThread(igsid, (x) => ({ ...x, prefersWa: prefersWa || x.prefersWa, waOpenerAt: undefined }));
  if (!t.phone) return false;
  if (t.coupleId) await cancelPendingDrafts(t.coupleId); // eski öneri gönderilmesin
  if (t.coupleId && (prefersWa || t.prefersWa)) {
    const now = new Date().toISOString();
    await mutateCouple(t.coupleId, (c) => ({ ...c, status: c.status === "new" ? "contacted" : c.status, callbackRequested: false, callbackAt: undefined, updatedAt: now })).catch(() => null);
  }
  await sendWaOpener(igsid, Boolean(t.test));
  return true;
}
