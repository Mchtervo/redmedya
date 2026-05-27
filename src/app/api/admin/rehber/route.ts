import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import {
  addManualContact,
  deleteRehberContact,
  readRehber,
} from "@/lib/rehber-store";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const list = await readRehber();
  list.sort((a, b) => {
    const da = a.weddingDate ? new Date(a.weddingDate).getTime() : 0;
    const db = b.weddingDate ? new Date(b.weddingDate).getTime() : 0;
    return da - db;
  });
  return NextResponse.json(list);
}

export async function POST(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await request.json();
  if (!body.phone?.trim()) {
    return NextResponse.json({ error: "Telefon gerekli" }, { status: 400 });
  }
  const entry = await addManualContact({
    firstName: body.firstName ?? "",
    lastName: body.lastName ?? "",
    phone: body.phone,
    weddingDate: body.weddingDate,
    note: body.note,
  });
  return NextResponse.json(entry);
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id gerekli" }, { status: 400 });
  const ok = await deleteRehberContact(id);
  if (!ok) return NextResponse.json({ error: "Bulunamadı" }, { status: 404 });
  return NextResponse.json({ ok: true });
}
