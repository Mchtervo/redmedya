import { siteConfig } from "@/config/site";

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

export function trackMetaEvent(
  event: MetaPixelEvent,
  params?: EventParams
): void {
  if (typeof window === "undefined") return;
  if (!siteConfig.metaPixelId) return;

  const payload: EventParams = {
    content_name: String(params?.content_name ?? "REDMEDYA.CO"),
    currency: "TRY",
    ...params,
  };

  if (params?.value != null) payload.value = Number(params.value) || 0;

  try {
    window.fbq?.("track", event, payload);
  } catch {
    // silent in production
  }

  if (process.env.NODE_ENV === "development") {
    console.debug("[Meta Pixel]", event, params);
  }
}

export function trackCustomEvent(
  event: string,
  params?: EventParams
): void {
  if (typeof window === "undefined") return;
  window.fbq?.("trackCustom", event, params);
}
