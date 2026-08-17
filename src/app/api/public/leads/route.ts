import { NextRequest, NextResponse } from "next/server";
import { appendLead, readLeads, updateLead } from "@/lib/leads-store";
import { findDuplicateLead } from "@/lib/leads-dedupe";
import { readSiteSettings, writeSiteSettings } from "@/lib/site-settings";
import { markDraftWhatsAppClicked } from "@/lib/package-drafts-store";
import type { LeadRecord } from "@/types/site-settings";
import { sendMetaCapiEvent } from "@/lib/meta-capi";
import { notifyNewLead, shouldSendLeadNotify } from "@/lib/lead-notify";
import {
  reservationPurchaseEventId,
  reservationScheduleEventId,
} from "@/lib/meta-tracking";
import { linkSessionLead } from "@/lib/analytics/analytics-sessions-store";

async function readLeadBody(request: NextRequest): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};
  return JSON.parse(text) as unknown;
}

/**
 * Public lead kaydı. sendBeacon text/plain JSON de kabul eder.
 * client_request_id ile keepalive+beacon mükerrer yazılmaz.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await readLeadBody(request)) as Omit<
      LeadRecord,
      "id" | "createdAt"
    > & {
      sessionId?: string;
      utm?: LeadRecord["utm"];
      metaAttribution?: LeadRecord["metaAttribution"];
      eventSourceUrl?: string;
      client_request_id?: string;
    };
    if (!body.customer?.phone?.trim()) {
      return NextResponse.json({ error: "Telefon gerekli" }, { status: 400 });
    }

    const existing = findDuplicateLead(await readLeads(), {
      clientRequestId: body.client_request_id,
      sessionId: body.sessionId,
      phone: body.customer.phone,
    });
    if (existing) {
      // fetch+beacon aynı id: Telegram gitmediyse (WhatsApp kesmesi) yedek istek göndersin.
      if (!shouldSendLeadNotify(existing)) {
        console.log("[lead-notify] atlandi, zaten bildirildi", {
          leadId: existing.id,
        });
      } else {
        console.log("[lead-notify] duplicate/retry, telegram", {
          leadId: existing.id,
        });
        try {
          const sent = await notifyNewLead(existing);
          if (sent) {
            await updateLead(existing.id, {
              notifiedAt: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.error(
            "[lead-notify] duplicate notify hata",
            err instanceof Error ? err.message : "unknown"
          );
        }
      }
      return NextResponse.json({
        ok: true,
        id: existing.id,
        scheduleEventId: reservationScheduleEventId(existing.id),
        purchaseEventId: reservationPurchaseEventId(existing.id),
        duplicate: true,
      });
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
      client_request_id: body.client_request_id?.slice(0, 80),
    };

    await appendLead(lead);

    // Yanıt dönmeden Telegram gitsin — Hostinger isteği bitince fire-and-forget düşer.
    try {
      const sent = await notifyNewLead(lead);
      if (sent) {
        await updateLead(lead.id, { notifiedAt: new Date().toISOString() });
      }
    } catch (err) {
      console.error(
        "[lead-notify] kayit sonrasi hata",
        err instanceof Error ? err.message : "unknown"
      );
    }

    const scheduleEventId = reservationScheduleEventId(lead.id);
    const purchaseEventId = reservationPurchaseEventId(lead.id);

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

    const eventSourceUrl =
      body.eventSourceUrl?.trim() ||
      request.headers.get("referer") ||
      undefined;
    const clientIp =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const clientUserAgent = request.headers.get("user-agent") || undefined;

    const capiUser = {
      phone: lead.customer.phone,
      firstName: lead.customer.firstName,
      lastName: lead.customer.lastName,
      externalId: lead.sessionId,
      fbp: lead.metaAttribution?.fbp,
      fbc: lead.metaAttribution?.fbc,
      clientIp,
      clientUserAgent,
    };
    const capiCustom = {
      value: lead.cart?.total,
      currency: "TRY" as const,
      orderId: lead.id,
    };

    // CAPI yanıtı bloklamasın — lead dosyaya yazıldı, client 500ms içinde 200 alsın.
    void sendMetaCapiEvent("Schedule", {
      eventId: scheduleEventId,
      actionSource: "website",
      eventSourceUrl,
      hostHeader: request.headers.get("host"),
      userData: capiUser,
      customData: {
        ...capiCustom,
        contentName: "wedding_reservation_request",
      },
    }).catch(() => {});

    void sendMetaCapiEvent("Purchase", {
      eventId: purchaseEventId,
      actionSource: "website",
      eventSourceUrl,
      hostHeader: request.headers.get("host"),
      userData: capiUser,
      customData: {
        ...capiCustom,
        contentName: "whatsapp_package_send",
      },
    }).catch(() => {});

    return NextResponse.json({
      ok: true,
      id: lead.id,
      scheduleEventId,
      purchaseEventId,
    });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
