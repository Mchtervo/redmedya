/**
 * Instagram DM → numara toplama (Meta'nın ücretsiz Instagram Messaging API'si; ChatPlace yok).
 *
 * Akış: reklam / profil → DM → sabit kampanya mesajı → numara yazınca çift listeye
 * (source meta_form, sourceRef instagram_dm) → arama sırası (Ece) + Telegram.
 * Cevaplar serbest AI yazımı DEĞİL; işletme sahibinin onayladığı sabit metinler.
 *
 * Meta: uygulama redmedi.co1 "instagram" aboneliği → /api/public/instagram-webhook.
 * Sayfa anahtarı, kayıtlı Meta anahtarından (ai-integrations metaAdsToken) türetilir.
 * Gelen olay sahte olmasın diye mesaj Meta'dan kimliğiyle yeniden okunur.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readIntegrations } from "@/lib/ai-couples/integrations";
import { ingestCouple } from "@/lib/ai-couples/store";
import { sendTelegramMessage } from "@/lib/lead-notify";

export const META_PAGE_ID = "105132225010303";
export const IG_HESAP_ID = "17841422791948178";
/** Meta webhook doğrulama dizesi (gizli değil; yalnız kurulum el sıkışması). */
export const IG_WEBHOOK_VERIFY = "rm-ig-dm-2026";
const G = "https://graph.facebook.com/v21.0";

/**
 * "test": yalnız IG_DM_TEST kullanıcılarına cevap. "herkes": tüm DM'lere. "kapali": hiç.
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
  `Numaranızı buraya yazarsanız hemen ${ARAMA_HATTI}'ten sizi arayıp paketleri, kampanyayı ve fiyatları tek tek anlatalım 📞😊\n\n` +
  "(Numaranız sadece sizi aramak için kullanılır 🔒)";

const DM_HATIRLATMA = [
  "Detayları ve size özel fiyatı telefonda 2-3 dakikada anlatabiliriz 😊📞 " +
    `Numaranızı yazmanız yeterli, ${ARAMA_HATTI}'ten hemen arayalım! ` +
    "Kampanya 31 Aralık'ta bitiyor, tarihiniz dolmadan yerinizi ayıralım 💍✨",
  "Her ay sadece 10 çift alabildiğimiz için hızlı davranmak lazım 🙈💨 " +
    `Telefon numaranızı yazarsanız ${ARAMA_HATTI}'ten arayıp tüm paketleri anlatalım 🎥📸🤍`,
];
/** Numara alındıktan sonra yazmaya devam ederse en fazla bu kadar hatırlatma; sonra sessiz (insan devralır). */
const MAX_HATIRLATMA = 2;

export function dmTesekkur(simdi = new Date()): string {
  const h = Number(new Intl.DateTimeFormat("tr-TR", { hour: "numeric", hour12: false, timeZone: "Europe/Istanbul" }).format(simdi));
  const ne = h >= 9 && h < 20 ? "Birazdan" : "Yarın sabah";
  return `Çok teşekkür ederiz 🥰🙏 ${ne} ${ARAMA_HATTI}'ten sizi arayacağız 📞 Şimdiden mutluluklar, görüşmek üzere 💍✨`;
}

/** Türk cep numarası → 05XXXXXXXXX (önündeki tarih rakamlarına yapışmaz). */
export function telefonBul(metin: string): string | null {
  const m = metin.match(/(?<!\d)(?:\+?\s*90[\s.-]*)?\(?0?\s*(5\d{2})\)?[\s.-]*(\d{3})[\s.-]*(\d{2})[\s.-]*(\d{2})(?!\d)/);
  return m ? `0${m[1]}${m[2]}${m[3]}${m[4]}` : null;
}

// ---- Durum (kişi başına) -------------------------------------------------

type Kisi = { kullanici?: string; cevap: number; telefon?: string; son?: string; mid: string[] };
const DURUM = dataPath("instagram-dm.json");

async function durumOku(): Promise<Record<string, Kisi>> {
  try {
    return JSON.parse(await readFile(DURUM, "utf-8")) as Record<string, Kisi>;
  } catch {
    return {};
  }
}
async function durumYaz(d: Record<string, Kisi>): Promise<void> {
  await mkdir(path.dirname(DURUM), { recursive: true });
  await writeFile(DURUM, JSON.stringify(d), { encoding: "utf-8", mode: 0o600 });
}

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

async function dmGonder(alici: string, metin: string, anahtar: string): Promise<boolean> {
  try {
    await graph(`${META_PAGE_ID}/messages`, anahtar, { recipient: { id: alici }, message: { text: metin }, messaging_type: "RESPONSE" });
    return true;
  } catch (e) {
    console.error("[instagram-dm] gönderilemedi:", e instanceof Error ? e.message : e);
    return false;
  }
}

function izinliMi(kullanici: string | null): boolean {
  if (IG_DM_MOD === "kapali") return false;
  if (IG_DM_MOD === "herkes") return true;
  const u = (kullanici ?? "").toLocaleLowerCase("tr-TR");
  return Boolean(u) && IG_DM_TEST.some((t) => t.toLocaleLowerCase("tr-TR").replace(/^@/, "") === u);
}

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

/** Tek mesajı işle: doğrula → (izinliyse) cevap ver → numara varsa çift ekle + Telegram. */
export async function igMesajIsle(o: IgOlay): Promise<string> {
  if (o.yanki || o.gonderen === IG_HESAP_ID || !o.metin) return "atlandı";
  const anahtar = await sayfaAnahtariAl();
  if (!anahtar) return "anahtar yok";
  const d = await durumOku();
  const kisi: Kisi = d[o.gonderen] ?? { cevap: 0, mid: [] };
  if (kisi.mid.includes(o.mid)) return "tekrar";
  const dogru = await mesajDogrula(o.mid, o.gonderen, anahtar);
  if (!dogru) return "doğrulanamadı";
  kisi.mid = [...kisi.mid, o.mid].slice(-30);
  kisi.kullanici = dogru.kullanici ?? kisi.kullanici;
  kisi.son = new Date().toISOString();
  const metin = dogru.metin || o.metin;

  const telefon = telefonBul(metin);
  if (telefon && kisi.telefon !== telefon) {
    kisi.telefon = telefon;
    const r = await ingestCouple({
      name: kisi.kullanici ? `@${kisi.kullanici}` : "Instagram DM",
      phone: telefon,
      source: "meta_form",
      sourceRef: "instagram_dm",
      note: `Instagram DM'den numara bıraktı${kisi.kullanici ? ` (@${kisi.kullanici})` : ""}. Mesaj: ${metin.slice(0, 300)}`,
    }).catch(() => null);
    await sendTelegramMessage(
      `📸 INSTAGRAM DM'DEN NUMARA: ${kisi.kullanici ? "@" + kisi.kullanici + " · " : ""}${telefon}\n💬 ${metin.slice(0, 200)}\n${r?.ok ? (r.created ? "Listeye eklendi → aranacak." : "Zaten listede.") : "⚠️ Listeye eklenemedi — siz arayın."}`
    ).catch(() => false);
  } else if (!kisi.telefon) {
    // Numarasız ilk mesaj: sahibine de haber (insan da bakabilsin)
    if (kisi.cevap === 0) await sendTelegramMessage(`📸 Instagram DM: ${kisi.kullanici ? "@" + kisi.kullanici : o.gonderen}\n💬 ${metin.slice(0, 200)}`).catch(() => false);
  }

  let sonuc = "kaydedildi";
  if (izinliMi(kisi.kullanici ?? null)) {
    let cevap: string | null = null;
    if (telefon) cevap = dmTesekkur();
    else if (kisi.telefon) cevap = null; // numara zaten alındı: sohbeti insan sürdürür
    else if (kisi.cevap === 0) cevap = DM_ACILIS;
    else if (kisi.cevap <= MAX_HATIRLATMA) cevap = DM_HATIRLATMA[(kisi.cevap - 1) % DM_HATIRLATMA.length];
    if (cevap && (await dmGonder(o.gonderen, cevap, anahtar))) {
      kisi.cevap += 1;
      sonuc = "cevaplandı";
    }
  }
  d[o.gonderen] = kisi;
  await durumYaz(d);
  return sonuc;
}
