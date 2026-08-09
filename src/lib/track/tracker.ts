"use client";

import {
  getSessionId,
  getUtm,
  getDevice,
  getReferrer,
  hasAnalyticsConsent,
} from "./session";

/**
 * §11 — Client-side journey tracker.
 * Batch: 3 sn'de bir veya 10 event'te flush; çıkışta navigator.sendBeacon.
 * KVKK onayı yoksa HİÇBİR şey gönderilmez. Payload'a form DEĞERİ asla girmez.
 */
export type TrackEventType =
  | "page_view"
  | "step_advanced"
  | "step_back"
  | "package_selected"
  | "plato_selected"
  | "cart_updated"
  | "addon_added"
  | "addon_removed"
  | "upsell_shown"
  | "upsell_accepted"
  | "upsell_dismissed"
  | "lastchance_shown"
  | "lastchance_accepted"
  | "lastchance_dismissed"
  | "date_selected"
  | "form_started"
  | "form_field_filled"
  | "share_link_copied"
  | "whatsapp_clicked"
  // §Adım-3 mikro funnel — insanlar 3. adımda TAM hangi alanda düşüyor
  | "step3_view"
  | "form_start"
  | "date_filled"
  | "name_filled"
  | "cta_click"
  // WhatsApp kısayolu + çıkış yakalama
  | "wa_shortcut_open"
  | "wa_shortcut_sent"
  | "exit_capture_shown"
  | "exit_capture_copy"
  | "exit_capture_whatsapp"
  | "session_end"
  | "package_step_view";

/** payload yalnızca anonim/ürün verisi; form DEĞERİ (isim/telefon/not) ASLA */
type Payload = Record<string, string | number | boolean | null | undefined | string[]>;
type QueuedEvent = { event_type: TrackEventType; ts: number; payload: Payload };

const FLUSH_MS = 3000;
const FLUSH_SIZE = 10;
let queue: QueuedEvent[] = [];
let timer: ReturnType<typeof setTimeout> | null = null;
let listenersBound = false;

function buildBody(events: QueuedEvent[]) {
  const utm = getUtm();
  return JSON.stringify({
    session_id: getSessionId(),
    utm_source: utm.utm_source,
    utm_campaign: utm.utm_campaign,
    device: getDevice(),
    referrer: getReferrer(),
    events,
  });
}

function flush(useBeacon = false) {
  if (!queue.length) return;
  const batch = queue;
  queue = [];
  if (timer) {
    clearTimeout(timer);
    timer = null;
  }
  const body = buildBody(batch);
  try {
    if (useBeacon && typeof navigator !== "undefined" && navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true,
        body,
      }).catch(() => {});
    }
  } catch {
    /* sessiz */
  }
}

function bindExitListeners() {
  if (listenersBound || typeof window === "undefined") return;
  listenersBound = true;
  const onHide = () => {
    if (document.visibilityState === "hidden") flush(true);
  };
  document.addEventListener("visibilitychange", onHide);
  window.addEventListener("pagehide", () => flush(true));
}

export function track(event_type: TrackEventType, payload: Payload = {}) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  bindExitListeners();
  queue.push({ event_type, ts: Date.now(), payload });
  if (queue.length >= FLUSH_SIZE) {
    flush();
  } else if (!timer) {
    timer = setTimeout(() => flush(), FLUSH_MS);
  }
}

/** Oturum sonu — çıkışta son adımla, sendBeacon ile */
export function trackSessionEnd(lastStep: number) {
  if (typeof window === "undefined" || !hasAnalyticsConsent()) return;
  queue.push({ event_type: "session_end", ts: Date.now(), payload: { last_step: lastStep } });
  flush(true);
}
