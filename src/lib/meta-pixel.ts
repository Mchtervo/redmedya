import { siteConfig } from "@/config/site";
import { gtagEvent } from "@/lib/gtag";
import { readMetaAttributionFromDocument } from "@/lib/meta-attribution";

export type MetaPixelEvent =
  | "ViewContent"
  | "AddToCart"
  | "PackageBuild"
  | "ServiceSelect"
  | "InitiateCheckout"
  | "Lead"
  | "WhatsAppClick"
  | "DiscountUse"
  | "FormStart"
  | "FormComplete"
  | "PageView";

type EventParams = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: EventParams,
      /** Meta dedup: eventID BURADA olmalı, params içinde DEĞİL */
      options?: { eventID?: string }
    ) => void;
    _fbq?: unknown;
  }
}

export type PixelCustomerData = {
  name?: string;
  phone?: string;
  email?: string;
};

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `evt_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function splitName(name?: string) {
  const clean = name?.trim();
  if (!clean) return {};
  const parts = clean.split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || undefined };
}

/**
 * Sunucu tarafı (CAPI) aynası — tarayıcıyla AYNI eventID ile /api/meta-events'e gider.
 * Hata YUTULMAZ: konsola yazılır (sessiz düşme sorunu için).
 */
function mirrorToCapi(
  eventName: string,
  eventId: string,
  params: EventParams,
  customer?: PixelCustomerData
): void {
  if (typeof window === "undefined") return;
  const attr = readMetaAttributionFromDocument();
  const { firstName, lastName } = splitName(customer?.name);
  fetch("/api/meta-events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    keepalive: true,
    body: JSON.stringify({
      eventName,
      eventId,
      eventSourceUrl: window.location.href,
      value: typeof params.value === "number" ? params.value : undefined,
      currency: "TRY",
      contentName:
        typeof params.content_name === "string" ? params.content_name : undefined,
      customer: {
        phone: customer?.phone,
        email: customer?.email,
        firstName,
        lastName,
      },
      fbp: attr.fbp,
      fbc: attr.fbc,
    }),
  })
    .then(async (res) => {
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; skipped?: boolean; error?: string }
        | null;
      if (!data?.ok) {
        // Sessiz düşme YOK — sebebi görünür olsun
        console.warn(
          `[CAPI] ${eventName} sunucuya gönderilemedi:`,
          data?.skipped
            ? "META_CAPI_ACCESS_TOKEN sunucuda TANIMLI DEĞİL (env eksik)"
            : (data?.error ?? `HTTP ${res.status}`)
        );
      }
    })
    .catch((e) => console.warn(`[CAPI] ${eventName} istek hatası:`, e));
}

/**
 * Meta Pixel event isimlerini GA4 standart event isimlerine eşler.
 * GA4 raporlarında bilinen olaylar (add_to_cart, generate_lead, vs.)
 * Audience builder ve conversion tracking için kullanılır.
 */
const META_TO_GA4_EVENT: Record<MetaPixelEvent, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  PackageBuild: "package_build",
  ServiceSelect: "select_item",
  InitiateCheckout: "begin_checkout",
  Lead: "generate_lead",
  WhatsAppClick: "whatsapp_click",
  DiscountUse: "discount_apply",
  FormStart: "form_start",
  FormComplete: "form_submit",
  PageView: "page_view",
};

export function trackMetaEvent(
  event: MetaPixelEvent,
  params?: EventParams,
  /** Lead/Contact gibi olaylarda CAPI eşleştirme kalitesi için (hash'lenir) */
  customer?: PixelCustomerData
): void {
  if (typeof window === "undefined") return;

  const payload: EventParams = {
    content_name: String(params?.content_name ?? "REDMEDYA.CO"),
    currency: "TRY",
    ...params,
  };

  if (params?.value != null) payload.value = Number(params.value) || 0;

  // Tarayıcı + sunucu AYNI id'yi kullanır (dedup). Dışarıdan verilmişse onu kullan.
  const eventId =
    typeof params?.event_id === "string" ? params.event_id : newEventId();
  delete payload.event_id; // params içinde gitmesin — dedup 4. argümanla olur

  /** Meta Pixel — sadece Pixel ID tanımlıysa */
  if (siteConfig.metaPixelId) {
    try {
      window.fbq?.("track", event, payload, { eventID: eventId });
    } catch (e) {
      console.warn("[Pixel] fbq hatası:", e);
    }
    /** Sunucu aynası (CAPI) — HER event için, aynı eventID */
    mirrorToCapi(event, eventId, payload, customer);
  }

  /** GA4 paralel gönderim — Meta isimlerini GA4 standardına çevir */
  try {
    gtagEvent(META_TO_GA4_EVENT[event] ?? event.toLowerCase(), payload);
  } catch {
    // silent
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[Track]", event, "→ GA4:", META_TO_GA4_EVENT[event], params);
  }
}

export function trackCustomEvent(
  event: string,
  params?: EventParams,
  customer?: PixelCustomerData
): void {
  if (typeof window === "undefined") return;

  const eventId =
    typeof params?.event_id === "string" ? params.event_id : newEventId();
  const clean: EventParams = { ...params };
  delete clean.event_id;

  /** Meta Pixel custom event — eventID 4. argümanda (dedup) */
  try {
    window.fbq?.("trackCustom", event, clean, { eventID: eventId });
  } catch (e) {
    console.warn("[Pixel] fbq custom hatası:", e);
  }

  /** Sunucu aynası (CAPI) — aynı eventID */
  mirrorToCapi(event, eventId, clean, customer);

  /** GA4 — özel olay (snake_case'e dönüştür) */
  const ga4Name = event
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase()
    .slice(0, 40);

  try {
    gtagEvent(ga4Name, params);
  } catch {
    // silent
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[Track:Custom]", event, "→ GA4:", ga4Name, params);
  }
}
