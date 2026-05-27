import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { patchRehberAndSyncReservation } from "@/lib/couple-sync";
import { getRehberById } from "@/lib/rehber-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const c = await getRehberById(id);
  if (!c) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json(c);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { id } = await params;
  const body = await request.json();
  const updated = await patchRehberAndSyncReservation(id, body);
  if (!updated) {
    return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  }
  return NextResponse.json(updated);
}
