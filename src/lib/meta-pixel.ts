import { siteConfig } from "@/config/site";
import { gtagEvent } from "@/lib/gtag";
import { readMetaAttributionFromDocument } from "@/lib/meta-attribution";
import {
  getBrowserEventSourceUrl,
  isMetaTrackingLiveBrowser,
  logMetaDebug,
} from "@/lib/meta-tracking";
import { ensureMetaNativeBridge } from "@/lib/meta-pixel-bridge";

/**
 * Production Meta'ya gidebilen STANDART event'ler (fbq track).
 * Lead / Purchase / Contact / Form* vb. kasıtlı olarak YOK.
 */
export const META_STANDARD_ALLOWED = new Set([
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Schedule",
]);

/**
 * Production Meta'ya gidebilen CUSTOM event'ler (fbq trackCustom).
 * SitePageView / PackageStepView / PackageCartSnapshot / Contact YOK.
 */
export const META_CUSTOM_ALLOWED = new Set(["PackageBuild", "WhatsAppClick"]);

/** CAPI'ye gidebilenler (browser ile aynı event_id). */
export const META_CAPI_ALLOWED = new Set([
  "PageView",
  "ViewContent",
  "PackageBuild",
  "AddToCart",
  "InitiateCheckout",
  "Schedule",
  "WhatsAppClick",
]);

export type MetaPixelEvent =
  | "ViewContent"
  | "AddToCart"
  | "PackageBuild"
  | "ServiceSelect"
  | "InitiateCheckout"
  | "Schedule"
  | "Lead"
  | "WhatsAppClick"
  | "DiscountUse"
  | "FormStart"
  | "FormComplete"
  | "PageView";

type EventParams = Record<string, string | number | boolean | undefined>;

export type TrackMetaOptions = {
  eventId?: string;
  /** false: yalnızca fbq. Varsayılan: standart funnel için true. */
  mirrorCapi?: boolean;
};

declare global {
  interface Window {
    fbq?: (
      action: string,
      event: string,
      params?: EventParams,
      options?: { eventID?: string }
    ) => void;
    _fbq?: unknown;
  }
}

export type PixelCustomerData = {
  name?: string;
  phone?: string;
  email?: string;
  externalId?: string;
};

function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `evt_${Date.now()}_${Math.floor(Math.random() * 1e9)}`;
}

function splitName(name?: string) {
  const clean = name?.trim();
  if (!clean) return {};
  const parts = clean.split(/\s+/);
  return { firstName: parts[0], lastName: parts.slice(1).join(" ") || undefined };
}

function mirrorToCapi(
  eventName: string,
  eventId: string,
  params: EventParams,
  customer?: PixelCustomerData
): void {
  try {
    if (typeof window === "undefined") return;
    if (!META_CAPI_ALLOWED.has(eventName)) return;

    const eventSourceUrl = getBrowserEventSourceUrl();
    const attr = readMetaAttributionFromDocument();
    const { firstName, lastName } = splitName(customer?.name);

    fetch("/api/meta-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        eventName,
        eventId,
        eventSourceUrl,
        value: typeof params.value === "number" ? params.value : undefined,
        currency: "TRY",
        contentName:
          typeof params.content_name === "string" ? params.content_name : undefined,
        customer: {
          phone: customer?.phone,
          email: customer?.email,
          firstName,
          lastName,
          externalId: customer?.externalId,
        },
        fbp: attr.fbp,
        fbc: attr.fbc,
      }),
    })
      .then(async (res) => {
        const data = (await res.json().catch(() => null)) as
          | { ok?: boolean; skipped?: boolean; error?: string; debug?: boolean }
          | null;
        if (data?.debug) return;
        if (!data?.ok) {
          console.warn(
            `[CAPI] ${eventName} sunucuya gönderilemedi:`,
            data?.skipped
              ? "META_CAPI_ACCESS_TOKEN yok veya production dışı (atlandı)"
              : (data?.error ?? `HTTP ${res.status}`)
          );
        }
      })
      .catch(() => {});
  } catch {
    /* CAPI hatası pixel'i durdurmasın */
  }
}

function safeFbq(
  method: "track" | "trackCustom",
  event: string,
  payload: EventParams,
  eventId: string
): void {
  ensureMetaNativeBridge();
  try {
    window.fbq?.(method, event, payload, { eventID: eventId });
  } catch {
    /* iOS webkit / Android WebView köprü hatası fbq'yu yutmasın */
  }
}

const META_TO_GA4_EVENT: Record<MetaPixelEvent, string> = {
  ViewContent: "view_item",
  AddToCart: "add_to_cart",
  PackageBuild: "package_build",
  ServiceSelect: "select_item",
  InitiateCheckout: "begin_checkout",
  Schedule: "schedule",
  Lead: "generate_lead",
  WhatsAppClick: "whatsapp_click",
  DiscountUse: "discount_apply",
  FormStart: "form_start",
  FormComplete: "form_submit",
  PageView: "page_view",
};

function emitGa4(event: string, params?: EventParams): void {
  try {
    gtagEvent(event, params);
  } catch {
    // silent
  }
}

/**
 * Standart Meta event. Allowlist dışı (Lead, Purchase, Form* …) Meta'ya GİTMEZ.
 */
export function trackMetaEvent(
  event: MetaPixelEvent,
  params?: EventParams,
  customer?: PixelCustomerData,
  options?: TrackMetaOptions
): void {
  if (typeof window === "undefined") return;

  const payload: EventParams = {
    content_name: String(params?.content_name ?? "REDMEDYA.CO"),
    currency: "TRY",
    ...params,
  };
  if (params?.value != null) payload.value = Number(params.value) || 0;

  const eventId =
    options?.eventId ||
    (typeof params?.event_id === "string" ? params.event_id : newEventId());
  delete payload.event_id;

  const url = getBrowserEventSourceUrl();
  const allowed = META_STANDARD_ALLOWED.has(event);

  // WhatsAppClick yanlışlıkla track() ile gelirse custom'a yönlendir
  if (event === "WhatsAppClick") {
    trackCustomEvent("WhatsAppClick", payload, customer, {
      eventId,
      mirrorCapi: false,
    });
    return;
  }

  emitGa4(META_TO_GA4_EVENT[event] ?? event.toLowerCase(), payload);

  if (!allowed) {
    logMetaDebug({
      event,
      event_id: eventId,
      url,
      source: "browser",
      params: payload as Record<string, unknown>,
      reason: "legacy/blocked — Meta'ya gönderilmedi (allowlist dışı)",
    });
    return;
  }

  const live = isMetaTrackingLiveBrowser();
  const mirror = options?.mirrorCapi !== false;

  if (!live) {
    logMetaDebug({
      event,
      event_id: eventId,
      url,
      source: "browser",
      params: payload as Record<string, unknown>,
      reason: "production dışı — Meta'ya gönderilmedi",
    });
    return;
  }

  if (!siteConfig.metaPixelId) return;

  safeFbq("track", event, payload, eventId);
  if (mirror) {
    mirrorToCapi(event, eventId, payload, customer);
  }
}

/**
 * Custom Meta event. Allowlist: PackageBuild, WhatsAppClick.
 */
export function trackCustomEvent(
  event: string,
  params?: EventParams,
  customer?: PixelCustomerData,
  options?: TrackMetaOptions
): void {
  if (typeof window === "undefined") return;

  const eventId =
    options?.eventId ||
    (typeof params?.event_id === "string" ? params.event_id : newEventId());
  const clean: EventParams = { ...params };
  delete clean.event_id;

  const url = getBrowserEventSourceUrl();
  const ga4Name = event
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9_]/g, "_")
    .toLowerCase()
    .slice(0, 40);
  emitGa4(ga4Name, params);

  const allowed = META_CUSTOM_ALLOWED.has(event);
  if (!allowed) {
    logMetaDebug({
      event,
      event_id: eventId,
      url,
      source: "browser",
      params: clean as Record<string, unknown>,
      reason: "legacy/blocked custom — Meta'ya gönderilmedi",
    });
    return;
  }

  const live = isMetaTrackingLiveBrowser();
  const mirror = options?.mirrorCapi !== false;

  if (!live) {
    logMetaDebug({
      event,
      event_id: eventId,
      url,
      source: "browser",
      params: clean as Record<string, unknown>,
      reason: "production dışı — Meta'ya gönderilmedi",
    });
    return;
  }

  safeFbq("trackCustom", event, clean, eventId);
  if (mirror) {
    mirrorToCapi(event, eventId, clean, customer);
  }
}
