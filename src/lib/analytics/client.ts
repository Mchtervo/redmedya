"use client";

/**
 * İç admin funnel analytics — Meta'ya GİTMEZ.
 * Anonim session_id; form değerleri / telefon / e-posta YOK.
 * Batch + urgent flush + sendBeacon.
 */

import {
  getSessionId,
  getUtm,
  getLastTouchUtm,
  getDevice,
  getReferrer,
} from "@/lib/track/session";
import { readMetaAttributionFromDocument } from "@/lib/meta-attribution";
import type { FunnelEventName } from "@/lib/analytics/types";

const URGENT_EVENTS = new Set([
  "AddToCart",
  "InitiateCheckout",
  "Schedule",
  "WhatsAppClick",
  "FormSubmitError",
]);

type MetaSafe = Record<string, string | number | boolean | null | undefined>;

type Queued = {
  client_event_id: string;
  event_name: FunnelEventName;
  event_time: number;
  page_url: string;
  metadata: MetaSafe;
  error_code?: string | null;
};

const FLUSH_MS = 2500;
const FLUSH_SIZE = 10;
let queue: Queued[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let bound = false;

function newClientEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `ce-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function detectBrowser(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return "Edge";
  if (/Chrome\//.test(ua)) return "Chrome";
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return "Safari";
  if (/Firefox\//.test(ua)) return "Firefox";
  return "Other";
}

function detectOs(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "iOS";
  if (/Android/.test(ua)) return "Android";
  if (/Windows/.test(ua)) return "Windows";
  if (/Mac OS X/.test(ua)) return "Mac";
  if (/Linux/.test(ua)) return "Linux";
  return "Other";
}

function sanitizeMeta(eventName: string, meta?: MetaSafe): MetaSafe {
  if (!meta) return {};
  if (eventName === "FormFieldError") {
    const field_name =
      typeof meta.field_name === "string" ? meta.field_name.slice(0, 40) : "";
    const error_type =
      typeof meta.error_type === "string" ? meta.error_type.slice(0, 40) : "";
    return field_name && error_type ? { field_name, error_type } : {};
  }
  const blocked = new Set([
    "name",
    "phone",
    "email",
    "firstName",
    "lastName",
    "note",
    "value",
    "message",
    "textarea",
    "password",
    "token",
    "authorization",
    "cookie",
    "lead_id",
  ]);
  const out: MetaSafe = {};
  for (const [k, v] of Object.entries(meta)) {
    if (blocked.has(k)) continue;
    if (v == null) continue;
    if (typeof v === "string") out[k] = v.slice(0, 120);
    else out[k] = v;
  }
  return out;
}

function buildBody(events: Queued[]) {
  const utm = getUtm();
  const last_touch_utm = getLastTouchUtm();
  const attr = readMetaAttributionFromDocument();
  return JSON.stringify({
    session_id: getSessionId(),
    landing_url:
      typeof sessionStorage !== "undefined"
        ? sessionStorage.getItem("rm_landing_url")
        : null,
    last_url: typeof location !== "undefined" ? location.href : null,
    referrer: getReferrer(),
    device: getDevice(),
    browser: detectBrowser(),
    os: detectOs(),
    viewport:
      typeof window !== "undefined"
        ? `${window.innerWidth}x${window.innerHeight}`
        : null,
    utm,
    last_touch_utm,
    fbp: attr.fbp ?? null,
    fbc: attr.fbc ?? null,
    events: events.map((e) => ({
      client_event_id: e.client_event_id,
      event_name: e.event_name,
      event_time: e.event_time,
      page_url: e.page_url,
      metadata: e.metadata,
      error_code: e.error_code ?? null,
    })),
  });
}

function flush(beacon = false) {
  if (!queue.length) return;
  const batch = queue;
  queue = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const body = buildBody(batch);
  try {
    if (beacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        "/api/analytics/collect",
        new Blob([body], { type: "application/json" })
      );
      if (ok) return;
    }
    fetch("/api/analytics/collect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body,
    }).catch(() => {});
  } catch {
    /* silent */
  }
}

function bindExit() {
  if (bound || typeof window === "undefined") return;
  bound = true;
  try {
    if (!sessionStorage.getItem("rm_landing_url")) {
      sessionStorage.setItem("rm_landing_url", location.href);
    }
  } catch {
    /* ignore */
  }
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
  window.addEventListener("pagehide", () => flush(true));
}

/** İç analytics event — Meta Pixel çağırmaz. lead_id kabul edilmez. */
export function trackFunnelEvent(
  event_name: FunnelEventName,
  opts?: {
    metadata?: MetaSafe;
    error_code?: string | null;
  }
): void {
  if (typeof window === "undefined") return;
  try {
    bindExit();
    queue.push({
      client_event_id: newClientEventId(),
      event_name,
      event_time: Date.now(),
      page_url: location.href,
      metadata: sanitizeMeta(event_name, opts?.metadata),
      error_code: opts?.error_code ?? null,
    });
    const urgent = URGENT_EVENTS.has(String(event_name));
    if (urgent || queue.length >= FLUSH_SIZE) flush();
    else if (!timer) timer = setTimeout(() => flush(), FLUSH_MS);
  } catch {
    /* analytics hatası sayfayı durdurmasın */
  }
}

export function trackFormFieldError(
  field_name: string,
  error_type: string
): void {
  trackFunnelEvent("FormFieldError", {
    metadata: { field_name, error_type },
    error_code: `${field_name}:${error_type}`,
  });
}

export function trackTechErrorClient(input: {
  error_type: string;
  message: string;
  stack?: string;
}): void {
  trackFunnelEvent("TechError", {
    metadata: {
      error_type: input.error_type.slice(0, 80),
      err_msg: input.message.slice(0, 160),
    },
    error_code: input.error_type.slice(0, 80),
  });
}
