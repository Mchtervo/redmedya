import { siteConfig } from "@/config/site";
import { gtagEvent } from "@/lib/gtag";
import { pixelWhatsAppClick } from "@/lib/paket/pixel";

export type AnalyticsEvent =
  | "campaign_klip_add"
  | "package_complete"
  | "whatsapp_click"
  | "coupon_applied"
  | "lead_submit"
  | "drone_bundle_apply";

type Params = Record<string, string | number | boolean | undefined>;

/** Doğrudan GA4 event — Meta'ya gitmez */
export function trackGA4(event: string, params?: Params): void {
  if (typeof window === "undefined") return;
  gtagEvent(event, params);
}

/**
 * İç analytics yönlendirici.
 * Meta conversion funnel'a (PageView…Schedule) dokunmaz.
 * Yalnızca gerçek WhatsApp tıklamasında custom WhatsAppClick (browser-only).
 */
export function trackAnalytics(
  event: AnalyticsEvent,
  params?: Params
): void {
  if (typeof window === "undefined") return;

  switch (event) {
    case "whatsapp_click":
      pixelWhatsAppClick(
        String(params?.content_name ?? "whatsapp"),
        typeof params?.value === "number" ? params.value : undefined
      );
      break;
    case "package_complete":
      trackGA4("package_complete", params);
      break;
    case "campaign_klip_add":
      trackGA4("campaign_klip_add", params);
      break;
    case "coupon_applied":
      trackGA4("coupon_applied", params);
      break;
    case "lead_submit":
      trackGA4("lead_submit", params);
      break;
    case "drone_bundle_apply":
      trackGA4("drone_bundle_apply", params);
      break;
    default:
      trackGA4(String(event), params);
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[Analytics]", event, params, siteConfig.name);
  }
}
