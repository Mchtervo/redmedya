import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { getLeadById, updateLead } from "@/lib/leads-store";
import { createReservation } from "@/lib/create-reservation";
import type { LeadLineDetail } from "@/types/reservations";
import type { CustomerInfo } from "@/stores/package-store";

type ApproveBody = {
  action: "approve";
  customer: CustomerInfo;
  depositAmount: number;
  total: number;
  subtotal: number;
  bundleDiscount?: number;
  couponDiscount?: number;
  services: LeadLineDetail[];
  shootingLocation?: string;
  shootingNote?: string;
};

type PatchBody = Partial<{
  lineDetails: LeadLineDetail[];
}>;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(lead);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const lead = await getLeadById(id);
  if (!lead) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });

  const body = await request.json();

  if (body.action === "reject") {
    if (lead.status === "rejected") {
      return NextResponse.json(lead);
    }
    const updated = await updateLead(id, {
      status: "rejected",
      reservationId: undefined,
    });
    return NextResponse.json(updated);
  }

  if (body.action === "approve") {
    const data = body as ApproveBody;
    const reservation = await createReservation({
      customer: data.customer ?? lead.customer,
      services: data.services ?? [],
      subtotal: Number(data.subtotal) || 0,
      bundleDiscount: Number(data.bundleDiscount) || 0,
      couponDiscount: Number(data.couponDiscount) || 0,
      total: Number(data.total) || 0,
      depositAmount: Number(data.depositAmount) || 0,
      shootingLocation: data.shootingLocation,
      shootingNote: data.shootingNote,
      couponCode: lead.couponCode,
      leadId: lead.id,
      source: "lead",
      conversionContext: {
        clientIp:
          request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
          request.headers.get("x-real-ip") ||
          undefined,
        clientUserAgent: request.headers.get("user-agent") ?? undefined,
      },
    });
    return NextResponse.json({ ok: true, reservation });
  }

  const patch = body as PatchBody;
  const updated = await updateLead(id, patch);
  return NextResponse.json(updated);
}
