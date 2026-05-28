import { siteConfig } from "@/config/site";
import { trackMetaEvent, trackCustomEvent } from "@/lib/meta-pixel";
import { gtagEvent } from "@/lib/gtag";

export type AnalyticsEvent =
  | "campaign_klip_add"
  | "package_complete"
  | "whatsapp_click"
  | "coupon_applied"
  | "lead_submit"
  | "drone_bundle_apply";

type Params = Record<string, string | number | boolean | undefined>;

/** Doğrudan GA4 event — özel parametrelerle (örn. server-side tracking) */
export function trackGA4(event: string, params?: Params): void {
  if (typeof window === "undefined") return;
  gtagEvent(event, params);
}

/**
 * Birleşik analytics — Meta Pixel + GA4 + özel olaylar.
 *
 * Not: `trackMetaEvent` ve `trackCustomEvent` zaten otomatik olarak hem
 * Meta'ya hem GA4'e gönderiyor (meta-pixel.ts içinde). Bu fonksiyon sadece
 * iş olayını birden fazla standart event'e dağıtmak için bir yönlendirici.
 */
export function trackAnalytics(
  event: AnalyticsEvent,
  params?: Params
): void {
  if (typeof window === "undefined") return;

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
