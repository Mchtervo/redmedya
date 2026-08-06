/**
 * A/B varyant konfigürasyonu.
 *
 * Adım 3 ana CTA metni burada. "Kilitle" kelimesinin taahhüt korkusu yaratma
 * ihtimaline karşı daha düşük eşikli B varyantı test ediliyor.
 * Varyantı değiştirmek için tek satır: ACTIVE_CTA_VARIANT.
 *
 * cta_click event'ine `variant` yazılır → panelde hangi metnin daha çok
 * tıklandığı kıyaslanabilir.
 */
export type CtaVariant = "A" | "B";

/** ŞU AN AKTİF — B (daha düşük eşikli, taahhüt kelimesi yok) */
export const ACTIVE_CTA_VARIANT: CtaVariant = "B";

export const CTA_TEXT: Record<CtaVariant, string> = {
  A: "🔒 Tarihimi Kilitle",
  B: "WhatsApp'tan Rezervasyonu Başlat",
};

export function activeCtaText(): string {
  return CTA_TEXT[ACTIVE_CTA_VARIANT];
}
