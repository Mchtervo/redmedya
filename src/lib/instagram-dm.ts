/**
 * Instagram DM (Meta'nın ücretsiz Instagram Messaging API'si; ChatPlace yok).
 *
 * Akış (izinli kullanıcı):
 *  1) İlk mesaj → otomatik sabit kampanya mesajı (numara İSTER ama zorlamaz; "buradan da bilgi veririz").
 *  2) Numara yazarsa → otomatik kısa teşekkür + çift listeye (source meta_form, sourceRef instagram_dm) → arama sırası.
 *  3) Numarasız sorular → yapay zekâ (WhatsApp asistanıyla aynı bilgiler) CEVAP ÖNERİSİ hazırlar,
 *     Telegram'a "✅ Gönder" düğmesiyle düşer; sahibi basmadan müşteriye HİÇBİR ŞEY gitmez.
 * Her gelen mesaj Telegram'a da bildirilir.
 *
 * Meta: uygulama redmedi.co1 "instagram" aboneliği → /api/public/instagram-webhook.
 * Sayfa anahtarı, kayıtlı Meta anahtarından (ai-integrations metaAdsToken) türetilir.
 * Gelen olay sahte olmasın diye mesaj Meta'dan kimliğiyle yeniden okunur.
 * Meta kuralı: müşterinin son mesajından sonra 24 saat içinde cevap verilebilir.
 */
import { randomUUID } from "crypto";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { ingestCouple } from "@/lib/ai-couples/store";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { ensureTelegramWebhook, tgApi, tgChatId } from "@/lib/ai-couples/wa-drafts";
import type { AiCouple } from "@/types/ai-couples";

export const META_PAGE_ID = "105132225010303";
export const IG_HESAP_ID = "17841422791948178";
/** Meta webhook doğrulama dizesi (gizli değil; yalnız kurulum el sıkışması). */
export const IG_WEBHOOK_VERIFY = "rm-ig-dm-2026";
const G = "https://graph.facebook.com/v21.0";
const PENCERE_MS = 24 * 3600_000;

/**
 * "test": yalnız IG_DM_TEST kullanıcılarına otomatik mesaj / öneri. "herkes": tüm DM'lere. "kapali": hiç.
 * Meta incelemesi (App Review) bitmeden zaten yalnız uygulama rolü olanlara gider.
 */
export const IG_DM_MOD: "kapali" | "test" | "herkes" = "test";
export const IG_DM_TEST: string[] = ["_mchtervo"];

export const ARAMA_HATTI = "0312 963 23 47";

export const DM_ACILIS =
  "Merhabaa 🤍 Öncelikle çok çok hayırlı olsun! 💍✨\n\n" +
  "Size güzel bir haberimiz var 🎉 2027 kampanyamız devam ediyor ama 31 Aralık'ta bitiyor ⏳ " +
  "Bu fiyatlardan her ay sadece 10 çift alabiliyoruz ve çoğu ayda son 3-4 yerimiz kaldı 🙈 " +
  "Kampanya bitince fiyatlara %40 zam geliyor 📈\n\n" +
  `Numaranızı yazarsanız ${ARAMA_HATTI}'ten arayıp paketleri ve fiyatları tek tek anlatalım 📞😊 ` +
  "İsterseniz buradan da yazabilirsiniz, merak ettiklerinizi hemen cevaplayalım 💬\n\n" +
  "(Numaranız sadece sizi aramak için kullanılır 🔒)";

export function dmTesekkur(simdi = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("tr-TR", { hour: "numeric", hour12: false, timeZone: "Europe/Istanbul" }).format(simdi));
  const ne = h >= 9 && h < 20 ? "Birazdan" : "Yarın sabah";
  return `Çok teşekkür ederiz 🥰🙏 ${ne} ${ARAMA_HATTI}'ten sizi arayacağız 📞 Bu arada merak ettiğiniz bir şey olursa buradan da yazabilirsiniz 💍✨`;
}

/** Türk cep numarası → 05XXXXXXXXX (önündeki tarih rakamlarına yapışmaz). */
export function telefonBul(metin: string): string | null {
  const m = metin.match(/(?<!\d)(?:\+?\s*90[\s.-]*)?\(?0?\s*(5\d{2})\)?[\s.-]*(\d{3})[\s.-]*(\d{2})[\s.-]*(\d{2})(?!\d)/);
  return m ? `0${m[1]}${m[2]}${m[3]}${m[4]}` : null;
}

// ---- Durum (kişi başına) -------------------------------------------------

type Satir = { y: "in" | "out"; t: string; at: string };
type Taslak = { id: string; text: string; at: string; durum: "bekliyor" | "gidiyor" | "gitti"; tgId?: number };
type Kisi = { kullanici?: string; cevap: number; telefon?: string; son?: string; mid: string[]; gecmis?: Satir[]; taslaklar?: Taslak[] };
const DURUM = dataPath("instagram-dm.json");

let zincir: Promise<unknown> = Promise.resolve();
/** Dosyaya sırayla eriş (aynı anda iki olay / düğme çift iş yapmasın). */
function kilitli<T>(fn: (d: Record<string, Kisi>) => Promise<T>): Promise<T> {
  const run = zincir.then(async () => {
    let d: Record<string, Kisi> = {};
    try {
      d = JSON.parse(await readFile(DURUM, "utf-8")) as Record<string, Kisi>;
    } catch {
      d = {};
    }
    const out = await fn(d);
    await mkdir(path.dirname(DURUM), { recursive: true });
    const tmp = `${DURUM}.${process.pid}.tmp`;
    await writeFile(tmp, JSON.stringify(d), { encoding: "utf-8", mode: 0o600 });
    await rename(tmp, DURUM);
    return out;
  });
  zincir = run.catch(() => undefined);
  return run;
}

const ekle = (k: Kisi, y: Satir["y"], t: string) => {
  // Gönderdiğimiz mesajın Meta yankısı da gelir: aynı metni 5 dk içinde iki kez yazma
  if (y === "out" && (k.gecmis ?? []).some((s) => s.y === "out" && s.t === t.slice(0, 1500) && Date.now() - Date.parse(s.at) < 300_000)) return;
  k.gecmis = [...(k.gecmis ?? []), { y, t: t.slice(0, 1500), at: new Date().toISOString() }].slice(-30);
};

// ---- Meta ----------------------------------------------------------------

let sayfaAnahtari: { deger: string; zaman: number } | null = null;

export async function sayfaAnahtariAl(): Promise<string | null> {
  if (sayfaAnahtari && Date.now() - sayfaAnahtari.zaman < 3600_000) return sayfaAnahtari.deger;
  const { metaAdsToken } = await readIntegrations();
  if (!metaAdsToken) return null;
  const r = (await fetch(`${G}/${META_PAGE_ID}?fields=access_token&access_token=${encodeURIComponent(metaAdsToken)}`, { signal: AbortSignal.timeout(10_000) })
    .then((x) => x.json())
    .catch(() => null)) as { access_token?: string } | null;
  // Kayıtlı anahtar zaten sayfa anahtarıysa doğrudan kullan
  const deger = r?.access_token || metaAdsToken;
  sayfaAnahtari = { deger, zaman: Date.now() };
  return deger;
}

async function graph<T>(yol: string, anahtar: string, govde?: unknown): Promise<T> {
  const r = await fetch(`${G}/${yol}${yol.includes("?") ? "&" : "?"}access_token=${encodeURIComponent(anahtar)}`, {
    method: govde ? "POST" : "GET",
    headers: govde ? { "Content-Type": "application/json" } : undefined,
    body: govde ? JSON.stringify(govde) : undefined,
    signal: AbortSignal.timeout(12_000),
  });
  const j = (await r.json().catch(() => ({}))) as T & { error?: { message?: string } };
  if (!r.ok || j.error) throw new Error(j.error?.message || `Meta ${r.status}`);
  return j;
}

/** Olayı Meta'dan doğrula: mesaj gerçekten bu kişiden mi geldi? Kullanıcı adını da verir. */
async function mesajDogrula(mid: string, gonderen: string, anahtar: string): Promise<{ metin: string; kullanici: string | null } | null> {
  try {
    const m = await graph<{ message?: string; from?: { id?: string; username?: string } }>(`${encodeURIComponent(mid)}?fields=message,from`, anahtar);
    if (m.from?.id !== gonderen) return null;
    return { metin: (m.message ?? "").trim(), kullanici: m.from?.username ?? null };
  } catch {
    return null;
  }
}

async function dmGonder(alici: string, metin: string, anahtar: string): Promise<string | null> {
  try {
    await graph(`${META_PAGE_ID}/messages`, anahtar, { recipient: { id: alici }, message: { text: metin }, messaging_type: "RESPONSE" });
    return null;
  } catch (e) {
    const m = e instanceof Error ? e.message : String(e);
    console.error("[instagram-dm] gönderilemedi:", m);
    return m;
  }
}

function izinliMi(kullanici: string | null): boolean {
  if (IG_DM_MOD === "kapali") return false;
  if (IG_DM_MOD === "herkes") return true;
  const u = (kullanici ?? "").toLocaleLowerCase("tr-TR");
  return Boolean(u) && IG_DM_TEST.some((t) => t.toLocaleLowerCase("tr-TR").replace(/^@/, "") === u);
}

const ad = (k: Kisi, igsid: string) => (k.kullanici ? `@${k.kullanici}` : `Instagram ${igsid.slice(-4)}`);

// ---- Yapay zekâ önerisi --------------------------------------------------

const IG_TALIMAT = `# BU YAZIŞMA INSTAGRAM DM
- Bu yazışma WhatsApp değil, Instagram DM (@redmedia.co). "WhatsApp hattı" deme; "buradan" de.
- Instagram'da daha sıcak ve samimi yaz; mesaja uygun 1-3 emoji kullan (💍✨🤍📸🎥😊 gibi), abartma.
- Müşterinin numarası yoksa ve konuşma ilerliyorsa, en fazla bir kez ve zorlamadan "isterseniz numaranızı yazın, 0312 963 23 47'den arayıp detaylı anlatalım" diyebilirsin; numara vermek istemezse buradan cevap vermeye devam et.
- "Görüşmek üzere / görüşürüz" gibi kapanış cümleleri kullanma.`;

/** WhatsApp asistanının bilgileriyle cevap önerisi (gönderilmez; yalnız metin). */
async function oneriUret(k: Kisi, igsid: string): Promise<{ metin: string | null; not?: string }> {
  const { generateWaReply } = await import("@/lib/ai-couples/wa-agent");
  const simdi = new Date().toISOString();
  // Asistan bir "çift" kaydı bekliyor: Instagram yazışmasından geçici bir kayıt (kaydedilmez)
  const sanal = {
    id: `ig-${igsid}`,
    name: k.kullanici ?? "",
    phone: k.telefon ?? "",
    source: "meta_form",
    grade: "warm",
    status: "new",
    contactLocked: false,
    callCount: 0,
    callbackRequested: false,
    calls: [],
    timeline: [],
    createdAt: simdi,
    updatedAt: simdi,
    messages: (k.gecmis ?? []).map((s, i) => ({ id: `${i}`, at: s.at, channel: "whatsapp", direction: s.y, kind: s.y === "out" ? "reply" : undefined, text: s.t })),
  } as unknown as AiCouple;
  const r = await generateWaReply(sanal, IG_TALIMAT);
  if (r.action === "send") return { metin: r.text, not: r.note };
  if (r.action === "handoff") return { metin: r.draft || r.hold || null, not: `Asistan emin değil: ${r.reason}` };
  return { metin: null, not: r.reason };
}

async function oneriTelegrama(igsid: string, k: Kisi, sonMesaj: string): Promise<void> {
  let o: { metin: string | null; not?: string };
  try {
    o = await oneriUret(k, igsid);
  } catch (e) {
    o = { metin: null, not: `Öneri üretilemedi (${e instanceof Error ? e.message.slice(0, 80) : "hata"})` };
  }
  const chat = tgChatId();
  if (!chat) return;
  if (!o.metin) {
    await sendTelegramMessage(`📸 Instagram DM — ${ad(k, igsid)}\n💬 ${sonMesaj.slice(0, 300)}\n\n🤖 Öneri yok${o.not ? `: ${o.not}` : ""}. Cevabı Instagram'dan kendiniz yazın.`).catch(() => false);
    return;
  }
  await ensureTelegramWebhook().catch(() => undefined);
  const taslak: Taslak = { id: randomUUID().replace(/-/g, "").slice(0, 10), text: o.metin.slice(0, 1000), at: new Date().toISOString(), durum: "bekliyor" };
  const tg = await tgApi<{ message_id: number }>("sendMessage", {
    chat_id: chat,
    text:
      `📸 Instagram DM — ${ad(k, igsid)}\n💬 Müşteri: ${sonMesaj.slice(0, 400)}\n\n🤖 Önerilen cevap:\n${taslak.text}` +
      `${o.not ? `\n\n📝 ${o.not}` : ""}\n\n👇 Instagram'dan göndermek için düğmeye basın (ya da bu mesaja "gönder" yazın). Basmazsanız hiçbir şey gitmez. Meta kuralı: müşterinin son mesajından sonra 24 saat içinde.`,
    disable_web_page_preview: true,
    reply_markup: { inline_keyboard: [[{ text: "✅ Instagram'dan gönder", callback_data: `igd:${igsid}:${taslak.id}` }]] },
  });
  taslak.tgId = tg?.result?.message_id;
  await kilitli(async (d) => {
    const kk = d[igsid];
    if (kk) kk.taslaklar = [...(kk.taslaklar ?? []), taslak].slice(-10);
  });
}

/** Telegram'da "Gönder"e basıldı ya da öneriye "gönder" yazıldı. */
export async function igTaslakOnayla(igsid: string, taslakId: string): Promise<{ ok: boolean; msg: string }> {
  const sec = await kilitli(async (d) => {
    const k = d[igsid];
    const t = k?.taslaklar?.find((x) => x.id === taslakId);
    if (!k || !t) return { hata: "Bu öneri bulunamadı." } as const;
    if (t.durum === "gitti") return { hata: "Bu mesaj zaten gönderildi." } as const;
    if (t.durum === "gidiyor") return { hata: "Gönderiliyor, bekleyin." } as const;
    const sonIn = [...(k.gecmis ?? [])].reverse().find((s) => s.y === "in");
    if (sonIn && Date.now() - Date.parse(sonIn.at) > PENCERE_MS) return { hata: "Müşterinin son mesajının üzerinden 24 saat geçti — Meta göndermeye izin vermiyor." } as const;
    if ((k.gecmis ?? []).some((s) => s.y === "out" && Date.parse(s.at) > Date.parse(t.at))) {
      return { hata: "Bu öneriden sonra müşteriye zaten mesaj gitti — çift mesaj olmasın diye göndermedim." } as const;
    }
    t.durum = "gidiyor";
    return { t: { ...t }, ad: ad(k, igsid) } as const;
  });
  if ("hata" in sec) return { ok: false, msg: sec.hata ?? "Gönderilemedi." };
  const anahtar = await sayfaAnahtariAl();
  const hata = anahtar ? await dmGonder(igsid, sec.t.text, anahtar) : "Meta anahtarı yok";
  await kilitli(async (d) => {
    const k = d[igsid];
    const t = k?.taslaklar?.find((x) => x.id === taslakId);
    if (!k || !t) return;
    t.durum = hata ? "bekliyor" : "gitti";
    if (!hata) {
      ekle(k, "out", sec.t.text);
      k.cevap += 1;
    }
  });
  return hata ? { ok: false, msg: `⚠️ ${sec.ad}: gönderilemedi (${hata.slice(0, 120)}). Instagram'dan kendiniz yazabilirsiniz.` } : { ok: true, msg: `✅ Instagram'dan gönderildi — ${sec.ad}` };
}

/** Telegram mesaj kimliğinden öneri bul (öneriye "gönder" yazıldığında). */
export async function igTaslakBul(tgMessageId: number): Promise<{ igsid: string; id: string } | null> {
  try {
    const d = JSON.parse(await readFile(DURUM, "utf-8")) as Record<string, Kisi>;
    for (const [igsid, k] of Object.entries(d)) {
      const t = k.taslaklar?.find((x) => x.tgId === tgMessageId);
      if (t) return { igsid, id: t.id };
    }
  } catch {
    /* yok */
  }
  return null;
}

// ---- Webhook ---------------------------------------------------------------

export type IgOlay = { gonderen: string; alici: string; mid: string; metin: string; yanki: boolean };

/** Webhook gövdesinden gelen mesaj olayları. */
export function olaylariAyikla(govde: unknown): IgOlay[] {
  const out: IgOlay[] = [];
  const g = govde as { object?: string; entry?: { messaging?: { sender?: { id?: string }; recipient?: { id?: string }; message?: { mid?: string; text?: string; is_echo?: boolean } }[] }[] };
  if (g?.object !== "instagram") return out;
  for (const e of g.entry ?? []) {
    for (const m of e.messaging ?? []) {
      if (!m.message?.mid || !m.sender?.id || !m.recipient?.id) continue;
      out.push({ gonderen: m.sender.id, alici: m.recipient.id, mid: m.message.mid, metin: (m.message.text ?? "").trim(), yanki: Boolean(m.message.is_echo) });
    }
  }
  return out;
}

/** Tek mesajı işle: doğrula → numara / ilk mesaj otomatik, diğerleri öneri → Telegram. */
export async function igMesajIsle(o: IgOlay): Promise<string> {
  // Sahibinin Instagram'dan elle yazdığı mesaj (yankı): geçmişe yaz ki öneriler bunu bilsin
  if (o.yanki) {
    if (o.metin) await kilitli(async (d) => { const k = d[o.alici]; if (k) ekle(k, "out", o.metin); });
    return "yankı";
  }
  if (o.gonderen === IG_HESAP_ID || !o.metin) return "atlandı";
  const anahtar = await sayfaAnahtariAl();
  if (!anahtar) return "anahtar yok";
  const dogru = await mesajDogrula(o.mid, o.gonderen, anahtar);
  if (!dogru) return "doğrulanamadı";
  const metin = dogru.metin || o.metin;
  const telefon = telefonBul(metin);

  const durum = await kilitli(async (d) => {
    const k: Kisi = d[o.gonderen] ?? { cevap: 0, mid: [] };
    if (k.mid.includes(o.mid)) return null;
    k.mid = [...k.mid, o.mid].slice(-40);
    k.kullanici = dogru.kullanici ?? k.kullanici;
    k.son = new Date().toISOString();
    ekle(k, "in", metin);
    const yeniTelefon = Boolean(telefon && k.telefon !== telefon);
    if (telefon) k.telefon = telefon;
    d[o.gonderen] = k;
    return { k: JSON.parse(JSON.stringify(k)) as Kisi, yeniTelefon };
  });
  if (!durum) return "tekrar";
  const { k, yeniTelefon } = durum;
  const izinli = izinliMi(k.kullanici ?? null);

  if (yeniTelefon && telefon) {
    const r = await ingestCouple({
      name: k.kullanici ? `@${k.kullanici}` : "Instagram DM",
      phone: telefon,
      source: "meta_form",
      sourceRef: "instagram_dm",
      note: `Instagram DM'den numara bıraktı${k.kullanici ? ` (@${k.kullanici})` : ""}. Mesaj: ${metin.slice(0, 300)}`,
    }).catch(() => null);
    await sendTelegramMessage(
      `📸 INSTAGRAM DM'DEN NUMARA: ${ad(k, o.gonderen)} · ${telefon}\n💬 ${metin.slice(0, 200)}\n${r?.ok ? (r.created ? "Listeye eklendi → aranacak." : "Zaten listede.") : "⚠️ Listeye eklenemedi — siz arayın."}`
    ).catch(() => false);
    if (izinli) {
      const t = dmTesekkur();
      if (!(await dmGonder(o.gonderen, t, anahtar))) await kilitli(async (d) => { const kk = d[o.gonderen]; if (kk) { ekle(kk, "out", t); kk.cevap += 1; } });
    }
    return "numara";
  }

  if (izinli && k.cevap === 0) {
    await sendTelegramMessage(`📸 Yeni Instagram DM — ${ad(k, o.gonderen)}\n💬 ${metin.slice(0, 300)}\n\n✉️ Kampanya mesajı otomatik gönderildi.`).catch(() => false);
    if (!(await dmGonder(o.gonderen, DM_ACILIS, anahtar))) await kilitli(async (d) => { const kk = d[o.gonderen]; if (kk) { ekle(kk, "out", DM_ACILIS); kk.cevap += 1; } });
    return "açılış";
  }

  if (izinli) {
    await oneriTelegrama(o.gonderen, k, metin);
    return "öneri";
  }
  // İzinli değil (test modu): yalnız sahibine haber
  await sendTelegramMessage(`📸 Instagram DM — ${ad(k, o.gonderen)}\n💬 ${metin.slice(0, 300)}`).catch(() => false);
  return "bildirildi";
}
