import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { getReservationById } from "@/lib/reservations-store";
import {
  deleteReservationAndSync,
  patchReservationAndSyncRehber,
} from "@/lib/couple-sync";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const r = await getReservationById(id);
  if (!r) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(r);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await request.json();
  const updated = await patchReservationAndSyncRehber(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(updated);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const ok = await deleteReservationAndSync(id);
  if (!ok) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
