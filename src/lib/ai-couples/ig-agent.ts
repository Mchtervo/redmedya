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
import { findCoupleByPhone, getCouple, ingestCouple, mutateCouple } from "@/lib/ai-couples/store";
import { historyForAgent } from "@/lib/ai-couples/journey";
import type { AiCouple, AiMessageRecord } from "@/types/ai-couples";
import { normalizePhone, displayPhone } from "@/lib/ai-couples/rules";
import { parseCallbackTime } from "@/lib/ai-couples/callback-time";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { FACTS } from "@/lib/ai-couples/wa-agent";
import { createIgDraftAndNotify } from "@/lib/ai-couples/wa-drafts";

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
  /** Paneldeki çifte kaç mesaj aktarıldı (ortak geçmiş: sesli asistan + WhatsApp da görsün) */
  synced?: number;
  /** Müşterinin aranmak istediği saat (ISO) — sesli asistan o saatte arar */
  callAt?: string;
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
  await patchThread(igsid, (x) => ({ ...x, ownerUntil: new Date(Date.now() + 12 * 3600_000).toISOString(), messages: [...x.messages, { at, dir: "out" as const, text: text.slice(0, 2000), by: "owner" as const }] }));
  await syncToCouple(igsid);
}

/* ---------------- cevap ---------------- */

const PROMPT = `Sen RED MEDIA'nın (Ankara, düğün fotoğrafı ve sinematik video) Instagram hesabında DM'lere cevap veren, güler yüzlü ve işini bilen bir ekip üyesisin. Çiftler genelde reklamı görüp yazıyor.

TEK AMACIN: Çifti sıcak karşılamak ve ${CALL_NUMBER} numaralı hattımızdan aranmak üzere TELEFON NUMARASINI almak. Detaylı bilgi ve çifte özel fiyat telefonda verilecek.

AKIŞ (sırayla, her mesajda sadece bir adım):
1) İlk cevap: samimi bir karşılama — "Merhabalar, öncelikle hayırlı olsun 🤍" gibi. İsmini biliyorsan ismiyle hitap edebilirsin (Ayşe Hanım / Mehmet Bey; emin değilsen isimsiz). Sonra ÇEKİM TARİHİNİ sor: "Çekim yaptırmak istediğiniz tarihi öğrenebilir miyim?" gibi ("düğün tarihi" deme, "çekim tarihi" de). Müşteri zaten bir şey sorduysa önce onu kısaca cevapla.
2) Tarih verse de vermese de ("belli değil", "daha karar vermedik" dese de) bir sonraki mesajda FIRSATI söyle ve harekete geçir:
   - "2027 için kaçırılmayacak bir fırsatımız var, fiyatlarımıza henüz %40 zam yansımadı" (erken rezervasyonda bugünkü fiyattan sabitleniyor).
   - Tarih verdiyse ÖNCE tarih_kontrol aracıyla bak ve GERÇEK kontenjanı söyle: "Her ay sadece 10 çift alıyoruz, [ay] için X yerimiz kaldı". O gün doluysa dürüstçe söyle, alternatif günleri sun. Tarih yoksa rakam verme, genel söyle: "her ay sadece 10 çift alıyoruz, yerler hızlı doluyor".
   - Aynı mesajda numarayı iste: "Detaylı bilgi ve size özel fiyat için ${CALL_NUMBER} numaralı hattımızdan sizi arayalım, uygunsa numaranızı yazar mısınız?" (kendi cümlelerinle, doğal).
3) Numara alındıysa (aşağıda yazar): teşekkür et ve arama saati henüz bilinmiyorsa SOR: "Sizi hangi saatte aramamız uygun olur?" gibi (bir kez sor). Saat belliyse (aşağıda yazar) onayla: "Tamamdır, [o saat] civarı ${CALL_NUMBER}'ten arıyoruz, numarayı kaydedebilirsiniz 😊". "Fark etmez / hemen" derse "o zaman en kısa sürede arıyoruz" de. Artık tekrar numara isteme; sorusu varsa kısaca cevapla.
4) Numara vermek istemezse ya da "buradan yazalım / buradan devam edelim / arama olmasın" derse: SORUN DEĞİL, DM'den devam et ve tam bir satışçı gibi ilgilen — fiyatları ve paketleri (aşağıdaki bilgilerden) net söyle, fiyat listesini at (https://redmediadugun.com/redmedia-2027-fiyat-listesi.pdf), tarihini takvimden kontrol et, kaporayla tarihi tutmayı teklif et. Bir daha numara isteme (en fazla çok sonra, doğal bir anda "isterseniz bir arayalım, 2 dakikada anlatırız" diyebilirsin).

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
  let newCallAt: string | null = null;
  if (t.phone && !t.callAt) {
    const recent = t.messages.slice(-3).filter((x) => x.dir === "in").map((x) => x.text).join(" ").replace(/(\+?90|0)?\s*5\d{2}[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/g, " ");
    const when = parseCallbackTime(recent, new Date());
    if (when && when.getTime() > Date.now() + 5 * 60_000 && when.getTime() < Date.now() + 14 * 86400_000) {
      newCallAt = when.toISOString();
      t = await patchThread(igsid, (x) => ({ ...x, callAt: newCallAt! }));
    }
  }

  const r = await generate(t);
  if (r.date) t = await patchThread(igsid, (x) => ({ ...x, weddingDate: r.date }));
  const who = `@${t.username ?? "?"}${t.name ? ` (${t.name})` : ""}`;
  if (newPhone) await onPhoneCaptured(t, newPhone, isTest);
  if (newCallAt) await applyCallTime(igsid, newCallAt, isTest);

  // HİÇBİR CEVAP KENDİLİĞİNDEN GİTMEZ: Telegram'a "✅ Gönder" düğmesiyle öneri olarak gider, sahibi onaylarsa gönderilir
  const lastIn = t.messages.filter((x) => x.dir === "in").slice(-3).map((x) => x.text).join(" / ");
  if (r.text) {
    const tg =
      `📸 INSTAGRAM CEVAP ÖNERİSİ${isTest ? " (TEST)" : ""} — ${who}${r.handoff ? "\n⚠️ Dikkat: bu konuya sizin bakmanız iyi olur" : ""}\n\n` +
      `💬 Müşteri: ${lastIn.slice(0, 500)}\n\n🤖 Önerdiğim cevap:\n${r.text}`;
    const ok = await createIgDraftAndNotify({ igsid, name: who, text: r.text, tg }).catch(() => false);
    if (!ok) await sendTelegramMessage(`${tg}\n\n(Düğme eklenemedi — beğendiyseniz kopyalayıp Instagram'dan gönderin.)`).catch(() => false);
  } else {
    await sendTelegramMessage(`👤 INSTAGRAM — SİZ DÖNÜN: ${who}\n💬 ${lastIn.slice(0, 500)}\n(Asistan cevap öneremedi.)`).catch(() => false);
  }
}

/** Müşterinin istediği arama saatini paneldeki çifte yaz → sesli asistan o saat gelmeden aramaz, gelince arar */
async function applyCallTime(igsid: string, callAt: string, isTest: boolean): Promise<void> {
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
  }
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
- Arama saati: ${t.callAt ? `BELLİ — ${new Date(t.callAt).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })} (onayla, tekrar sorma)` : t.phone ? "henüz bilinmiyor — bir kez sor" : "-"}
- Kalan yer (ay: kalan/toplam): ${kontenjan}${known}`;
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

