import { NextRequest, NextResponse } from "next/server";
import { insertAnalyticsEvents } from "@/lib/analytics/analytics-events-store";
import { upsertAnalyticsSession } from "@/lib/analytics/analytics-sessions-store";
import { upsertTechError } from "@/lib/analytics/tech-errors-store";
import { isIgnorableClientError } from "@/lib/meta-pixel-bridge";
import {
  loadSeenClientEventIds,
  persistSeenClientEventIds,
} from "@/lib/analytics/event-ids-store";
import {
  LIMITS,
  clampStr,
  normalizeCollectEvents,
  sanitizeTechMessage,
  sanitizeUtm,
  type IncomingCollectEvent,
} from "@/lib/analytics/collect-core";
import { allowAnalyticsCollect } from "@/lib/analytics/rate-limit";
import {
  eventNameToFunnelStep,
  FUNNEL_STEP_RANK,
  type AnalyticsEvent,
  type FunnelStep,
} from "@/lib/analytics/types";

function newId(): string {
  return `aevt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function clientIp(request: NextRequest): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * Anonim funnel analytics toplama.
 * Auth yok (public); allowlist + validation + dedupe + rate-limit.
 * lead_id client'tan kabul edilmez. Meta'ya gitmez.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      session_id?: string;
      landing_url?: string | null;
      last_url?: string | null;
      referrer?: string | null;
      device?: string | null;
      browser?: string | null;
      os?: string | null;
      viewport?: string | null;
      country?: string | null;
      city?: string | null;
      utm?: unknown;
      last_touch_utm?: unknown;
      fbp?: string | null;
      fbc?: string | null;
      events?: IncomingCollectEvent[];
    };

    const sessionId = clampStr(body.session_id, LIMITS.sessionIdMax);
    if (!sessionId || !Array.isArray(body.events) || !body.events.length) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const incomingCount = Math.min(body.events.length, LIMITS.eventsPerRequestMax);
    if (!allowAnalyticsCollect(sessionId, clientIp(request), incomingCount)) {
      return NextResponse.json(
        { ok: false, error: { code: "RATE_LIMIT", message: "Çok fazla istek" } },
        { status: 429 }
      );
    }

    const seen = await loadSeenClientEventIds();
    const { accepted, rejected } = normalizeCollectEvents(body.events, seen);
    if (!accepted.length) {
      return NextResponse.json({
        ok: true,
        count: 0,
        rejected,
      });
    }

    await persistSeenClientEventIds(seen);

    const firstTouchIn = sanitizeUtm(body.utm);
    const lastTouchIn = sanitizeUtm(body.last_touch_utm ?? body.utm);

    let maxStep: FunnelStep = "page";
    let converted = false;

    const rows: AnalyticsEvent[] = accepted.map((e) => {
      const step = eventNameToFunnelStep(e.event_name);
      if (
        step !== "other" &&
        FUNNEL_STEP_RANK[step] >= FUNNEL_STEP_RANK[maxStep]
      ) {
        maxStep = step;
      }
      if (e.event_name === "Schedule" || e.event_name === "FormSubmitSuccess") {
        converted = true;
      }

      return {
        id: newId(),
        client_event_id: e.client_event_id,
        session_id: sessionId,
        event_name: e.event_name,
        event_time: e.event_time,
        page_url: e.page_url,
        funnel_step: step,
        metadata: e.metadata,
        lead_id: null,
        error_code: e.error_code,
        device: clampStr(body.device, 20),
        browser: clampStr(body.browser, LIMITS.browserMax),
        os: clampStr(body.os, LIMITS.osMax),
        utm_source: firstTouchIn.utm_source ?? null,
        utm_campaign: firstTouchIn.utm_campaign ?? null,
        utm_medium: firstTouchIn.utm_medium ?? null,
      };
    });

    await insertAnalyticsEvents(rows);

    await upsertAnalyticsSession({
      session_id: sessionId,
      last_seen_at: new Date().toISOString(),
      landing_url: clampStr(body.landing_url, LIMITS.urlMax),
      last_url: clampStr(body.last_url, LIMITS.urlMax),
      referrer: clampStr(body.referrer, LIMITS.referrerMax),
      device:
        body.device === "mobile" ||
        body.device === "tablet" ||
        body.device === "desktop"
          ? body.device
          : null,
      browser: clampStr(body.browser, LIMITS.browserMax),
      os: clampStr(body.os, LIMITS.osMax),
      viewport: clampStr(body.viewport, LIMITS.viewportMax),
      country: clampStr(body.country, 60),
      city: clampStr(body.city, 60),
      utm: firstTouchIn,
      first_touch_utm: firstTouchIn,
      last_touch_utm: lastTouchIn,
      fbp: clampStr(body.fbp, LIMITS.fbpMax),
      fbc: clampStr(body.fbc, LIMITS.fbcMax),
      max_funnel_step: maxStep,
      converted,
      event_count: rows.length,
    });

    for (const r of rows) {
      if (r.event_name === "TechError") {
        const message = sanitizeTechMessage(
          String(r.metadata.err_msg ?? "error")
        );
        if (isIgnorableClientError(message)) continue;
        await upsertTechError({
          session_id: sessionId,
          error_type: String(r.metadata.error_type ?? r.error_code ?? "js"),
          message,
          funnel_step: r.funnel_step,
          page_url: r.page_url,
          device: r.device,
          browser: r.browser,
          os: r.os,
          stack_preview: sanitizeTechMessage(
            String(r.metadata.stack_preview ?? "")
          ),
        });
      }
    }

    return NextResponse.json({ ok: true, count: rows.length, rejected });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
