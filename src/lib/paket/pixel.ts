import { trackMetaEvent, trackCustomEvent } from "@/lib/meta-pixel";
import { readMetaAttributionFromDocument } from "@/lib/meta-attribution";

/**
 * PAKET OLUŞTUR V2 piksel olayları — tarayıcı pikseli + Meta CAPI (sunucu).
 * Her olay AYNI event_id ile hem fbq'ya hem /api/meta-events'e gider; Meta
 * çiftleri deduplike eder. iOS/adblock kullanıcılarında sinyal korunur.
 *
 * NOT: Eski `PackageCartSnapshot` otomatik tekrarlı atılmıyor; yalnızca
 * kullanıcı aksiyonlarında tek sefer ateşler.
 */

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

export type PixelCustomer = {
  name?: string;
  phone?: string;
  email?: string;
};

function splitName(name?: string): { firstName?: string; lastName?: string } {
  const clean = name?.trim();
  if (!clean) return {};
  // "Ayşe & Mehmet" veya "Ad Soyad" → ilk parça ad, kalan soyad
  const parts = clean.split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || undefined };
}

/** Sunucu CAPI'ye aynı event_id ile gönder (fire-and-forget, keepalive). */
function postCapi(
  eventName: string,
  eventId: string,
  opts: { value?: number; contentName?: string; customer?: PixelCustomer } = {}
): void {
  if (typeof window === "undefined") return;
  const attr = readMetaAttributionFromDocument();
  const { firstName, lastName } = splitName(opts.customer?.name);
  try {
    fetch("/api/meta-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true, // window.open / navigasyon sonrası da tamamlanır
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl: window.location.href,
        value: opts.value,
        currency: "TRY",
        contentName: opts.contentName,
        customer: {
          phone: opts.customer?.phone,
          email: opts.customer?.email,
          firstName,
          lastName,
        },
        fbp: attr.fbp,
        fbc: attr.fbc,
      }),
    }).catch(() => {});
  } catch {
    /* sessiz */
  }
}

/** Adım 1 — paket seçimi */
export function pixelSelectPackage(packageName: string, price: number) {
  const id = newEventId();
  trackMetaEvent("AddToCart", { content_name: packageName, value: price, event_id: id });
  postCapi("AddToCart", id, { value: price, contentName: packageName });
}

/** Adım 1 → 2 geçiş */
export function pixelInitiateCheckout(total: number) {
  const id = newEventId();
  trackMetaEvent("InitiateCheckout", { value: total, event_id: id });
  postCapi("InitiateCheckout", id, { value: total });
}

/** Upsell / ekstra eklenince */
export function pixelAddExtra(name: string, price: number) {
  const id = newEventId();
  trackMetaEvent("AddToCart", { content_name: name, value: price, event_id: id });
  postCapi("AddToCart", id, { value: price, contentName: name });
}

/** Adım 3 — form dolduruldu */
export function pixelLead(total: number, customer?: PixelCustomer) {
  const id = newEventId();
  trackMetaEvent("Lead", { value: total, event_id: id });
  postCapi("Lead", id, { value: total, customer });
}

/** Tarihimi Kilitle tık — WhatsAppClick (custom) + Contact + CAPI Contact */
export function pixelLockDate(total: number, customer?: PixelCustomer) {
  const id = newEventId();
  trackMetaEvent("WhatsAppClick", { value: total, event_id: id });
  trackCustomEvent("Contact", { value: total, currency: "TRY", event_id: id });
  postCapi("Contact", id, { value: total, customer });
}

/** Funnel — her adım görüntülemesi (GA4 + Meta custom) */
export function pixelStepView(step: number) {
  trackCustomEvent("PackageStepView", { step });
}
