import { NextRequest, NextResponse } from "next/server";
import { appendLead } from "@/lib/leads-store";
import { readSiteSettings, writeSiteSettings } from "@/lib/site-settings";
import { markDraftWhatsAppClicked } from "@/lib/package-drafts-store";
import type { LeadRecord } from "@/types/site-settings";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<LeadRecord, "id" | "createdAt">;
    if (!body.customer?.phone?.trim()) {
      return NextResponse.json({ error: "Telefon gerekli" }, { status: 400 });
    }

    const extra = body as {
      sessionId?: string;
      metaAttribution?: LeadRecord["metaAttribution"];
    };

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
      sessionId: extra.sessionId,
      metaAttribution: extra.metaAttribution,
    };

    await appendLead(lead);

    const sessionId = (body as { sessionId?: string }).sessionId;
    if (sessionId) {
      await markDraftWhatsAppClicked(sessionId, lead.id);
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

    return NextResponse.json({ ok: true, id: lead.id });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
