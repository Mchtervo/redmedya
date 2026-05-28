import { siteConfig } from "@/config/site";
import { gtagEvent } from "@/lib/gtag";

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
      params?: EventParams
    ) => void;
    _fbq?: unknown;
  }
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
  params?: EventParams
): void {
  if (typeof window === "undefined") return;

  const payload: EventParams = {
    content_name: String(params?.content_name ?? "REDMEDYA.CO"),
    currency: "TRY",
    ...params,
  };

  if (params?.value != null) payload.value = Number(params.value) || 0;

  /** Meta Pixel — sadece Pixel ID tanımlıysa */
  if (siteConfig.metaPixelId) {
    try {
      window.fbq?.("track", event, payload);
    } catch {
      // silent in production
    }
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
  params?: EventParams
): void {
  if (typeof window === "undefined") return;

  /** Meta Pixel custom event */
  try {
    window.fbq?.("trackCustom", event, params);
  } catch {
    // silent
  }

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
