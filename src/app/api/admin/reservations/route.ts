import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { readReservations } from "@/lib/reservations-store";
import { createReservation } from "@/lib/create-reservation";
import type { LeadLineDetail } from "@/types/reservations";
import type { CustomerInfo } from "@/stores/package-store";
import {
  customerHasName,
  normalizeCustomerName,
} from "@/lib/customer-name";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const list = await readReservations();
  list.sort((a, b) => {
    const da = a.customer.weddingDate
      ? new Date(a.customer.weddingDate).getTime()
      : 0;
    const db = b.customer.weddingDate
      ? new Date(b.customer.weddingDate).getTime()
      : 0;
    return da - db;
  });
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const body = await request.json();
  const rawCustomer = body.customer as CustomerInfo | undefined;
  if (!rawCustomer || !customerHasName(rawCustomer)) {
    return NextResponse.json(
      { error: "Çift adı gerekli (ad veya soyad alanına yazın)" },
      { status: 400 }
    );
  }
  const customer = normalizeCustomerName(rawCustomer);

  const services = (body.services ?? []) as LeadLineDetail[];
  if (services.length === 0) {
    return NextResponse.json(
      { error: "En az bir hizmet ekleyin" },
      { status: 400 }
    );
  }

  const reservation = await createReservation({
    customer,
    services,
    subtotal: Number(body.subtotal) || 0,
    bundleDiscount: Number(body.bundleDiscount) || 0,
    couponDiscount: Number(body.couponDiscount) || 0,
    total: Number(body.total) || 0,
    depositAmount: Number(body.depositAmount) || 0,
    shootingLocation: body.shootingLocation,
    shootingNote: body.shootingNote,
    studioOwned: Boolean(body.studioOwned),
    couponCode: body.couponCode,
    leadId: body.leadId,
    draftSessionId: body.draftSessionId,
    source: body.leadId ? "lead" : body.draftSessionId ? "draft" : "manual",
  });

  return NextResponse.json({ ok: true, reservation });
}
