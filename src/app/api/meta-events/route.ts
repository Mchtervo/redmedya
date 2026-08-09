import { NextRequest, NextResponse } from "next/server";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { META_CAPI_ALLOWED } from "@/lib/meta-pixel";

/**
 * Meta Conversions API (CAPI) — tarayıcı ile AYNI event_id.
 * Allowlist dışı (Lead, Purchase, Contact, SitePageView…) reddedilir.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      eventName?: string;
      eventId?: string;
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
    };

    if (!body.eventName || !body.eventId) {
      return NextResponse.json(
        { ok: false, error: "eventName ve eventId gerekli" },
        { status: 400 }
      );
    }

    if (!META_CAPI_ALLOWED.has(body.eventName)) {
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

    // event_source_url: istemcinin gerçek sayfası; yoksa Referer (hard-code root yok)
    const eventSourceUrl =
      body.eventSourceUrl?.trim() ||
      request.headers.get("referer") ||
      undefined;

    const result = await sendMetaCapiEvent(body.eventName, {
      eventId: body.eventId,
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
