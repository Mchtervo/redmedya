/** Admin funnel analytics — PII yok. Meta'ya gitmez. */

export const FUNNEL_META_EVENTS = [
  "PageView",
  "ViewContent",
  "PackageBuild",
  "AddToCart",
  "InitiateCheckout",
  "Schedule",
  "WhatsAppClick",
] as const;

export const FUNNEL_INTERNAL_EVENTS = [
  "PackageSelected",
  "PlatoSelected",
  "ExtraServiceSelected",
  "DateSelected",
  "FormStarted",
  "FormFieldError",
  "FormSubmitAttempt",
  "FormSubmitError",
  "FormSubmitSuccess",
  "StepBack",
  "StepForward",
  "ExitIntent",
  "TechError",
  "SessionAbandoned",
] as const;

export type FunnelEventName =
  | (typeof FUNNEL_META_EVENTS)[number]
  | (typeof FUNNEL_INTERNAL_EVENTS)[number]
  | string;

export type FunnelStep =
  | "page"
  | "view_content"
  | "package_build"
  | "add_to_cart"
  | "checkout"
  | "schedule"
  | "whatsapp"
  | "other";

export type AnalyticsUtm = {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
};

export type AnalyticsSession = {
  session_id: string;
  first_seen_at: string;
  last_seen_at: string;
  landing_url: string | null;
  last_url: string | null;
  referrer: string | null;
  device: "mobile" | "tablet" | "desktop" | null;
  browser: string | null;
  os: string | null;
  viewport: string | null;
  country: string | null;
  city: string | null;
  /** First-touch (geri uyumluluk); asla overwrite edilmez. */
  utm: AnalyticsUtm;
  first_touch_utm: AnalyticsUtm;
  last_touch_utm: AnalyticsUtm;
  fbp: string | null;
  fbc: string | null;
  /** Yalnızca server-side başarılı rezervasyon sonrası. */
  lead_id: string | null;
  max_funnel_step: FunnelStep;
  converted: boolean;
  event_count: number;
};

export type AnalyticsEvent = {
  id: string;
  /** Client üretir; retry dedupe anahtarı. */
  client_event_id: string;
  session_id: string;
  event_name: FunnelEventName;
  event_time: string;
  page_url: string | null;
  funnel_step: FunnelStep;
  metadata: Record<string, string | number | boolean | null>;
  /** Collect üzerinden yazılmaz; rezervasyon sonrası session'da tutulur. */
  lead_id: string | null;
  error_code: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
};

export type TechErrorRow = {
  id: string;
  session_id: string | null;
  error_type: string;
  message: string;
  funnel_step: FunnelStep | null;
  page_url: string | null;
  device: string | null;
  browser: string | null;
  os: string | null;
  first_seen_at: string;
  last_seen_at: string;
  count: number;
  /** Admin-only kısa stack; hassas veri yok */
  stack_preview: string | null;
};

export type DateRangePreset =
  | "today"
  | "yesterday"
  | "last_7"
  | "last_14"
  | "last_30"
  | "custom";

export function eventNameToFunnelStep(name: string): FunnelStep {
  switch (name) {
    case "PageView":
      return "page";
    case "ViewContent":
      return "view_content";
    case "PackageBuild":
    case "PackageSelected":
    case "PlatoSelected":
      return "package_build";
    case "AddToCart":
    case "ExtraServiceSelected":
      return "add_to_cart";
    case "InitiateCheckout":
    case "FormStarted":
    case "DateSelected":
    case "FormFieldError":
    case "FormSubmitAttempt":
    case "FormSubmitError":
      return "checkout";
    case "Schedule":
    case "FormSubmitSuccess":
      return "schedule";
    case "WhatsAppClick":
      return "whatsapp";
    default:
      return "other";
  }
}

export const FUNNEL_STEP_RANK: Record<FunnelStep, number> = {
  page: 0,
  view_content: 1,
  package_build: 2,
  add_to_cart: 3,
  checkout: 4,
  schedule: 5,
  whatsapp: 4,
  other: 0,
};
