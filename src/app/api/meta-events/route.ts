import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { META_CAPI_ALLOWED } from "@/lib/meta-pixel";
import { BACKFILL_EVENT_NAMES } from "@/lib/capi-backfill";

const BACKFILL_EVENTS = new Set<string>(BACKFILL_EVENT_NAMES);

function isAuthorizedBackfill(request: NextRequest, body: { backfill?: unknown }): boolean {
  if (body.backfill !== true) return false;
  const expected = process.env.CAPI_BACKFILL_TOKEN?.trim();
  if (!expected) return false;
  const header = request.headers.get("x-capi-backfill-token")?.trim();
  return header === expected;
}

/**
 * Meta Conversions API (CAPI) — tarayıcı ile AYNI event_id.
 * Allowlist dışı (Lead, Contact…) reddedilir.
 * Backfill: CAPI_BACKFILL_TOKEN + backfill:true ile Lead/Contact/WhatsAppClick
 * ve orijinal eventTime kabul edilir.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventName?: string;
      eventId?: string;
      eventTime?: number;
      eventSourceUrl?: string;
      value?: number;
      currency?: string;
      contentName?: string;
      contentIds?: string[];
      customer?: {
        email?: string;
        phone?: string;
        firstName?: string;
        lastName?: string;
        externalId?: string;
      };
      fbp?: string;
      fbc?: string;
      backfill?: boolean;
    };

    if (!body.eventName || !body.eventId) {
      return NextResponse.json(
        { ok: false, error: "eventName ve eventId gerekli" },
        { status: 400 }
      );
    }

    const backfill = isAuthorizedBackfill(request, body);
    const allowed =
      META_CAPI_ALLOWED.has(body.eventName) ||
      (backfill && BACKFILL_EVENTS.has(body.eventName));

    if (!allowed) {
      return NextResponse.json({
        ok: true,
        skipped: true,
        debug: true,
        error: `CAPI allowlist dışı: ${body.eventName}`,
      });
    }

    const hostHeader = request.headers.get("host");
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const clientUserAgent = request.headers.get("user-agent") || undefined;

    const eventSourceUrl =
      body.eventSourceUrl?.trim() ||
      request.headers.get("referer") ||
      undefined;

    const eventTime =
      typeof body.eventTime === "number" && Number.isFinite(body.eventTime)
        ? Math.floor(body.eventTime)
        : undefined;

    const result = await sendMetaCapiEvent(body.eventName, {
      eventId: body.eventId,
      eventTime,
      actionSource: "website",
      eventSourceUrl,
      hostHeader,
      userData: {
        email: body.customer?.email,
        phone: body.customer?.phone,
        firstName: body.customer?.firstName,
        lastName: body.customer?.lastName,
        externalId: body.customer?.externalId,
        fbp: body.fbp,
        fbc: body.fbc,
        clientIp,
        clientUserAgent,
      },
      customData: {
        value: body.value,
        currency: body.currency ?? "TRY",
        contentName: body.contentName,
        contentIds: body.contentIds,
      },
    });

    if (result.skipped && !result.debug) {
      console.error(
        "[CAPI] ATLANDI: META_CAPI_ACCESS_TOKEN yok veya yapılandırma eksik."
      );
    } else if (!result.ok && !result.debug) {
      console.error(`[CAPI] Meta reddetti (${body.eventName}):`, result.error);
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[CAPI] route hatası:", e);
    return NextResponse.json(
      { ok: false, error: "CAPI isteği başarısız" },
      { status: 500 }
    );
  }
}
