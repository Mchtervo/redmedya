/**
 * TEKLİF MESAJININ ZORUNLU PARÇALARI (saf dosya).
 * Fiyatın müşteriye yazıyla ilk verildiği mesajda şu dördü MUTLAKA bulunur:
 *   1) paket içeriği  2) ek hizmetler (fiyat düşüşüyle)  3) "her ay bu kampanya fiyatından sadece 10 çift"  4) drone hediyesi
 * Asistan unutursa ensureOfferPoints eksik olanı kendisi ekler — unutma ihtimali kalmaz.
 */
export type OfferCap = { monthLabel: string; remaining: number } | null | undefined;

export const OFFER_PACKAGES =
  "• Fotoğraf: 7.000 yerine 5.000 TL — poz sınırı yok, çekilenlerin tümü teslim\n" +
  "• Fotoğraf + sinematik klip: 12.600 yerine 9.000 TL — fotoğraflara ek 1,5–2 dakikalık sinematik klip\n" +
  "• Fotoğraf + klip + albüm: 19.600 yerine 14.000 TL — ek olarak 1 büyük + 2 aile albümü (30x60), 22 rötuşlu fotoğraf";

export const OFFER_EXTRAS =
  "Pakete ekleyebileceğiniz ek hizmetler %20 indirimli: gelin alma klibi, kuaför hazırlık çekimi, salona giriş ve ilk dans klibi 5.000 yerine 4.000 TL; düğünün başından after'a kadar çekim 10.000 yerine 8.000 TL.";

/** "Her ay bu kampanya fiyatından sadece 10 çift…" + (5 ve altıysa) kalan yer + drone hediyesi */
export function offerScarcity(cap: OfferCap): string {
  const yer = cap && cap.remaining > 0 && cap.remaining <= 5 ? `; ${cap.monthLabel} için son ${cap.remaining} yer kaldı` : "";
  return `Her ay bu kampanya fiyatından sadece 10 çift alıyoruz${yer}. Bu yerlerden ayırtan çiftlerimize dış çekimde drone çekimi hediye 🎁`;
}

const fold = (t: string) => t.toLocaleLowerCase("tr-TR");
const hasPrice = (t: string) => /\b(5\.000|9\.000|14\.000)\s*(tl|₺)/i.test(t);
const has10 = (t: string) => /10 çift/.test(fold(t));
const hasDrone = (t: string) => /drone/.test(fold(t));
const hasExtras = (t: string) => /(gelin alma|kuaför|salona giriş|ilk dans|after|ek hizmet)/.test(fold(t));
const hasContent = (t: string) => /(poz sınırı|tümü teslim|tamamı teslim|1,5|2 dakika|albüm|rötuş)/.test(fold(t));

/**
 * Cevap paket fiyatı veriyorsa ve yazışmada bu noktalar henüz YAZIYLA söylenmediyse eksik olanı ekler.
 * history: bizim daha önce müşteriye GİDEN mesajlarımız (PDF satırları sayılmaz — müşteri PDF'i açmamış olabilir).
 * weddingOnly: müşterinin düğünü olduğu biliniyorsa düğün günü ek hizmetleri de sayılır; bilinmiyorsa sadece genel cümle.
 */
export function ensureOfferPoints(text: string, history: string[], cap: OfferCap, opts: { hasWedding?: boolean } = {}): { text: string; added: string[] } {
  if (!hasPrice(text)) return { text, added: [] };
  // Rakip fiyatı / pazarlık cevabı gibi kısa savunma mesajlarına ekleme yapılmaz
  if (/(ekipman|tecrübe)/.test(fold(text)) && /(dikkat edin|fiyat politika)/.test(fold(text))) return { text, added: [] };
  const said = history.filter((h) => !h.startsWith("[")).join("\n");
  const added: string[] = [];
  let out = text.trim();
  if (!hasContent(out) && !hasContent(said)) {
    out += "\n\nTüm paketlerde poz sınırı yok, çekilen fotoğrafların tümü teslim; çekim ortalama 1,5 saat sürüyor.";
    added.push("paket içeriği");
  }
  if (!hasExtras(out) && !hasExtras(said)) {
    out += "\n\n" + (opts.hasWedding === false ? "Albüm seti gibi ek hizmetlerimiz de pakete eklenince %20 indirimli (albüm seti 6.250 yerine 5.000 TL)." : OFFER_EXTRAS);
    added.push("ek hizmetler");
  }
  const need10 = !has10(out) && !has10(said);
  const needDrone = !hasDrone(out) && !hasDrone(said);
  if (need10 && needDrone) {
    out += "\n\n" + offerScarcity(cap);
    added.push("10 çift + drone hediyesi");
  } else if (need10) {
    const yer = cap && cap.remaining > 0 && cap.remaining <= 5 ? `; ${cap.monthLabel} için son ${cap.remaining} yer kaldı` : "";
    out += `\n\nHer ay bu kampanya fiyatından sadece 10 çift alıyoruz${yer}.`;
    added.push("10 çift");
  } else if (needDrone) {
    out += "\n\nKampanya yerlerinden ayırtan çiftlerimize dış çekimde drone çekimi hediye 🎁";
    added.push("drone hediyesi");
  }
  return { text: out, added };
}
