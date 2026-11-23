/** Saf yardımcı (sunucu + tarayıcı): asistana gösterilecek belge mesajı metni. */
const PRICE_LIST_NOTE =
  "2027 fiyat listemiz — tüm paket ve ek hizmet fiyatları kampanya indirimleriyle (fotoğraf 5.000, fotoğraf + sinematik klip 9.000, fotoğraf + klip + albüm 14.000 TL ve ek hizmetler). FİYATLAR MÜŞTERİYE VERİLDİ.";

/** İçeriği okunmamış fiyat listesi PDF'ine içerik notu ekler; diğer metinleri aynen döndürür */
export function docNote(text: string): string {
  if (text.includes("İÇERİK:")) return text;
  if (/^\[(PDF|belge)\][^\n]*fiyat[-_ ]?listesi/i.test(text)) return `${text} — İÇERİK: ${PRICE_LIST_NOTE}`;
  return text;
}

/** Müşteriye GERÇEKTEN ulaşmış mesaj mı? (geri çekilen / gönderilemeyen mesaj gitmiş sayılmaz) */
export function isDelivered(m: { text: string }): boolean {
  return !m.text.startsWith("[GERİ ÇEKİLDİ]") && !m.text.startsWith("[GÖNDERİLEMEDİ]");
}

/** Sadece kapanış / teşekkür mesajı mı? ("Tamamdır teşekkürler", "👍") — cevap gerektirmez, takip sürer.
 *  Katı: kapanış sözcükleri ve emojiler çıkarıldıktan sonra geriye anlamlı bir şey kalmamalı. */
export function isClosingText(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");
  if (!t || t.length > 80 || t.includes("?")) return false;
  const rest = t
    .replace(/\p{Extended_Pictographic}|\p{Emoji_Modifier}|\uFE0F|\u200D/gu, " ")
    .replace(/(çok |cok )?(teşekkürler|teşekkür ederim|teşekkür ederiz|teşekkür ediyorum|teşekkür|tesekkurler|tesekkur ederim|tesekkur|sağ ?olun|sağ ?ol|sag ?olun|sag ?ol|eyvallah|allah razı olsun)/g, " ")
    .replace(/(tamamdır|tamamdir|tamam|tmm|peki|anladım|anladim|anlaşıldı|oldu|okey|ok|olur)(?![\p{L}])/gu, " ")
    .replace(/(iyi (günler|gunler|akşamlar|aksamlar|çalışmalar|calismalar|geceler)|kolay gelsin|hayırlı (işler|günler|akşamlar)|görüşürüz|gorusuruz|görüşmek üzere|selametle)/g, " ")
    .replace(/(hocam|abi|abla|kardeşim|hanım|hanim|bey|efendim|dilerim|size de|sizlere|ben de|bende|rica ederim)(?![\p{L}])/gu, " ")
    .replace(/[^\p{L}\p{N}]+/gu, "");
  return rest.length <= 2;
}
