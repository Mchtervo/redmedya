import { siteConfig } from "@/config/site";
import { formatWeddingDateDisplay } from "@/lib/date-format";
import { formatPhoneForWhatsApp, formatPrice } from "@/lib/utils";
import type { CustomerInfo, SelectedLineItem } from "@/stores/package-store";

export type WhatsAppMessageInput = {
  customer: CustomerInfo;
  lineItems: SelectedLineItem[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  total: number;
  couponCode?: string;
  bundlePercent?: number;
};

export function buildWhatsAppMessage(input: WhatsAppMessageInput): string {
  const {
    customer,
    lineItems,
    subtotal,
    bundleDiscount,
    couponDiscount,
    total,
    couponCode,
    bundlePercent,
  } = input;

  const serviceLines = lineItems
    .map((s) => {
      const qty =
        s.pricingType === "quantity" && s.quantity > 1
          ? ` (${s.quantity} adet)`
          : s.pricingType === "pages"
            ? ""
            : s.quantity > 1
              ? ` (×${s.quantity})`
              : "";
      const priceLabel = s.isGift
        ? `HEDİYE (normal ${formatPrice(s.originalLineTotal ?? 0)})`
        : formatPrice(s.lineTotal);
      return `• ${s.name}${qty} — ${priceLabel}`;
    })
    .join("\n");

  const lines = [
    "Merhaba REDMEDYA ekibi,",
    "",
    "Web sitemizden rezervasyon / teklif talebim:",
    "",
    `👤 ${[customer.firstName, customer.lastName].filter(Boolean).join(" ")}`,
    `📞 ${customer.phone}`,
    customer.weddingDate
      ? `📅 Düğün Tarihi: ${formatWeddingDateDisplay(customer.weddingDate)}`
      : "",
    customer.note ? `📝 Not: ${customer.note}` : "",
    "",
    "— Paket özeti —",
    serviceLines || "(Henüz hizmet seçilmedi)",
    "",
    `Ara Toplam: ${formatPrice(subtotal)}`,
    bundleDiscount > 0
      ? `Paket İndirimi (%${bundlePercent ?? 20}): -${formatPrice(bundleDiscount)}`
      : "",
    couponDiscount > 0 ? `Kupon İndirimi: -${formatPrice(couponDiscount)}` : "",
    couponCode ? `Kupon Kodu: ${couponCode}` : "",
    `*TOPLAM: ${formatPrice(total)}*`,
    "",
    "Detaylı bilgi ve müsaitlik için dönüş bekliyorum. Teşekkürler!",
  ].filter(Boolean);

  return lines.join("\n");
}

/** İletişim bilgisi var, sepet boş veya kısmi */
export function buildWhatsAppInquiryMessage(customer?: CustomerInfo): string {
  if (!customer?.firstName?.trim() && !customer?.phone?.trim()) {
    return [
      "Merhaba REDMEDYA ekibi,",
      "",
      "Web sitenizden ulaşıyorum. Düğün / dış çekim paketi için bilgi ve teklif almak istiyorum.",
      "",
      "Teşekkürler!",
    ].join("\n");
  }

  return [
    "Merhaba REDMEDYA ekibi,",
    "",
    "Web sitemizden iletişim talebim:",
    "",
    `👤 ${[customer.firstName, customer.lastName].filter(Boolean).join(" ")}`,
    `📞 ${customer.phone}`,
    customer.weddingDate
      ? `📅 Düğün Tarihi: ${formatWeddingDateDisplay(customer.weddingDate)}`
      : "",
    customer.note ? `📝 Not: ${customer.note}` : "",
    "",
    "Paket ve müsaitlik hakkında bilgi almak istiyorum. Teşekkürler!",
  ]
    .filter(Boolean)
    .join("\n");
}

export function getWhatsAppUrl(message: string, phone?: string): string {
  const num = formatPhoneForWhatsApp(phone ?? siteConfig.defaultWhatsApp);
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${num}?text=${encoded}`;
}

/** Müşteriye onay mesajı — admin panelden paylaş */
export function buildCustomerConfirmationMessage(input: {
  customerName: string;
  weddingDate?: string;
  services: { label: string; price: number; isGift?: boolean }[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  total: number;
  depositAmount: number;
  remainingAmount: number;
  bundlePercent?: number;
}): string {
  const serviceLines = input.services
    .map((s) => {
      const priceLabel = s.isGift
        ? "HEDİYE"
        : formatPrice(s.price);
      return `• ${s.label} — ${priceLabel}`;
    })
    .join("\n");

  return [
    `Merhaba ${input.customerName},`,
    "",
    "REDMEDYA rezervasyon özetiniz:",
    "",
    input.weddingDate
      ? `📅 Düğün tarihi: ${formatWeddingDateDisplay(input.weddingDate)}`
      : "",
    "",
    "— Hizmetler —",
    serviceLines,
    "",
    `Ara toplam: ${formatPrice(input.subtotal)}`,
    input.bundleDiscount > 0
      ? `Paket indirimi (%${input.bundlePercent ?? 20}): -${formatPrice(input.bundleDiscount)}`
      : "",
    input.couponDiscount > 0
      ? `Kupon indirimi: -${formatPrice(input.couponDiscount)}`
      : "",
    `*Paket toplamı: ${formatPrice(input.total)}*`,
    input.depositAmount > 0
      ? `Alınan kapora: ${formatPrice(input.depositAmount)}`
      : "",
    `*Kalan ödeme: ${formatPrice(input.remainingAmount)}*`,
    "",
    "Yukarıdaki hizmetler ve güncel fiyatlarla rezervasyonu onaylıyor musunuz?",
    "Onayınızı yazmanız yeterli — tarihinizi kesinleştiriyoruz.",
    "",
    "Teşekkürler, REDMEDYA",
  ]
    .filter(Boolean)
    .join("\n");
}
