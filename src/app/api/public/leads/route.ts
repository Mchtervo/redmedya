import { NextRequest, NextResponse } from "next/server";
import { appendLead } from "@/lib/leads-store";
import { readSiteSettings, writeSiteSettings } from "@/lib/site-settings";
import { markDraftWhatsAppClicked } from "@/lib/package-drafts-store";
import type { LeadRecord } from "@/types/site-settings";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { reservationScheduleEventId } from "@/lib/meta-tracking";
import { linkSessionLead } from "@/lib/analytics/analytics-sessions-store";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<LeadRecord, "id" | "createdAt"> & {
      sessionId?: string;
      utm?: LeadRecord["utm"];
      metaAttribution?: LeadRecord["metaAttribution"];
      eventSourceUrl?: string;
    };
    if (!body.customer?.phone?.trim()) {
      return NextResponse.json({ error: "Telefon gerekli" }, { status: 400 });
    }

    const lead: LeadRecord = {
      id: `lead-${Date.now()}`,
      createdAt: new Date().toISOString(),
      source: body.source ?? "whatsapp",
      status: "pending",
      customer: body.customer,
      cart: body.cart,
      lineDetails: body.lineDetails,
      bundleDiscount: body.bundleDiscount,
      couponDiscount: body.couponDiscount,
      couponCode: body.couponCode,
      sessionId: body.sessionId,
      utm: body.utm,
      metaAttribution: body.metaAttribution,
    };

    await appendLead(lead);

    const scheduleEventId = reservationScheduleEventId(lead.id);

    if (body.sessionId) {
      await markDraftWhatsAppClicked(body.sessionId, lead.id);
      await linkSessionLead(body.sessionId, lead.id);
    }

    if (body.couponCode) {
      const settings = await readSiteSettings();
      const code = body.couponCode.toUpperCase();
      settings.couponUsage = {
        ...settings.couponUsage,
        [code]: (settings.couponUsage[code] ?? 0) + 1,
      };
      await writeSiteSettings(settings);
    }

    // Schedule — yalnızca kayıt başarısından sonra (CAPI).
    // Browser aynı event_id ile fbq track eder (dedupe).
    const eventSourceUrl =
      body.eventSourceUrl?.trim() ||
      request.headers.get("referer") ||
      undefined;
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const clientUserAgent = request.headers.get("user-agent") || undefined;

    await sendMetaCapiEvent("Schedule", {
      eventId: scheduleEventId,
      actionSource: "website",
      eventSourceUrl,
      hostHeader: request.headers.get("host"),
      userData: {
        phone: lead.customer.phone,
        firstName: lead.customer.firstName,
        lastName: lead.customer.lastName,
        externalId: lead.sessionId,
        fbp: lead.metaAttribution?.fbp,
        fbc: lead.metaAttribution?.fbc,
        clientIp,
        clientUserAgent,
      },
      customData: {
        value: lead.cart?.total,
        currency: "TRY",
        contentName: "wedding_reservation_request",
        orderId: lead.id,
      },
    });

    return NextResponse.json({
      ok: true,
      id: lead.id,
      scheduleEventId,
    });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
