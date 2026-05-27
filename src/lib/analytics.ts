import { siteConfig } from "@/config/site";
import { trackMetaEvent, trackCustomEvent } from "@/lib/meta-pixel";

export type AnalyticsEvent =
  | "campaign_klip_add"
  | "package_complete"
  | "whatsapp_click"
  | "coupon_applied"
  | "lead_submit"
  | "drone_bundle_apply";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA4_ID =
  process.env.NEXT_PUBLIC_GA4_ID?.trim() || "G-YXDNEBTFMN";

export function trackGA4(event: string, params?: Params): void {
  if (typeof window === "undefined") return;
  if (!GA4_ID || !window.gtag) return;
  try {
    window.gtag("event", event, {
      send_to: GA4_ID,
      currency: "TRY",
      ...params,
    });
  } catch {
    /* ignore */
  }
}

/** Meta Pixel + GA4 + özel Meta olayları */
export function trackAnalytics(
  event: AnalyticsEvent,
  params?: Params
): void {
  if (typeof window === "undefined") return;

  trackGA4(event, params);

  switch (event) {
    case "whatsapp_click":
      trackMetaEvent("WhatsAppClick", params);
      trackMetaEvent("InitiateCheckout", {
        ...params,
        content_name: String(params?.content_name ?? "whatsapp"),
      });
      break;
    case "package_complete":
      trackMetaEvent("Lead", {
        ...params,
        content_name: "whatsapp_teklif_tamam",
      });
      trackMetaEvent("FormComplete", params);
      trackCustomEvent("PackageComplete", {
        ...params,
        status: "confirmed",
      });
      trackGA4("generate_lead", {
        value: params?.value,
        items: params?.items,
      });
      break;
    case "campaign_klip_add":
      trackMetaEvent("AddToCart", {
        content_name: `campaign_klip_${params?.service_id ?? ""}`,
      });
      trackCustomEvent("CampaignKlipAdd", params);
      break;
    case "coupon_applied":
      trackMetaEvent("DiscountUse", {
        coupon_code: String(params?.coupon_code ?? ""),
      });
      trackCustomEvent("CouponApplied", params);
      break;
    case "lead_submit":
      trackCustomEvent("LeadSubmit", params);
      break;
    case "drone_bundle_apply":
      trackMetaEvent("AddToCart", {
        content_name: "drone_hediye_paketi",
        ...params,
      });
      trackCustomEvent("DroneBundleApplied", params);
      break;
    default:
      trackCustomEvent(event, params);
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[Analytics]", event, params, siteConfig.name);
  }
}
