import { trackMetaEvent, trackCustomEvent } from "@/lib/meta-pixel";

/**
 * PAKET OLUŞTUR V2 piksel olayları.
 *
 * NOT: CAPI (sunucu) aynası artık MERKEZÎ olarak lib/meta-pixel.ts içinde —
 * her fbq çağrısı otomatik olarak aynı eventID ile /api/meta-events'e de gider.
 * Burada ayrıca CAPI çağrısı YAPILMAZ (çift gönderim olmasın).
 *
 * Eski `PackageCartSnapshot` otomatik tekrarlı atılmıyor.
 */

export type PixelCustomer = { name?: string; phone?: string; email?: string };

/** Adım 1 — paket seçimi */
export function pixelSelectPackage(packageName: string, price: number) {
  trackMetaEvent("AddToCart", { content_name: packageName, value: price });
}

/** Adım 1 → 2 geçişi ve tarih seçimi */
export function pixelInitiateCheckout(total: number) {
  trackMetaEvent("InitiateCheckout", { value: total });
}

/** Upsell / ekstra eklenince */
export function pixelAddExtra(name: string, price: number) {
  trackMetaEvent("AddToCart", { content_name: name, value: price });
}

/** Adım 3 — form dolduruldu (müşteri verisi CAPI eşleştirmesi için hash'lenir) */
export function pixelLead(total: number, customer?: PixelCustomer) {
  trackMetaEvent("Lead", { value: total }, customer);
}

/** Tarihimi Kilitle — WhatsAppClick + Contact (ikisi de CAPI'ye aynalanır) */
export function pixelLockDate(total: number, customer?: PixelCustomer) {
  trackMetaEvent("WhatsAppClick", { value: total }, customer);
  trackCustomEvent("Contact", { value: total, currency: "TRY" }, customer);
}

/** Funnel — her adım görüntülemesi */
export function pixelStepView(step: number) {
  trackCustomEvent("PackageStepView", { step });
}
