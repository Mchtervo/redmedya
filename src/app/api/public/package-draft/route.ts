import { NextRequest, NextResponse } from "next/server";
import { upsertPackageDraft } from "@/lib/package-drafts-store";
import type { PackageDraftRecord } from "@/types/package-drafts";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<PackageDraftRecord>;
    if (!body.sessionId?.trim()) {
      return NextResponse.json({ error: "sessionId gerekli" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const draft: PackageDraftRecord = {
      sessionId: body.sessionId.trim(),
      createdAt: body.createdAt ?? now,
      updatedAt: now,
      customer: {
        firstName: body.customer?.firstName ?? "",
        lastName: body.customer?.lastName ?? "",
        phone: body.customer?.phone ?? "",
        weddingDate: body.customer?.weddingDate ?? "",
        note: body.customer?.note ?? "",
      },
      selectedIds: body.selectedIds ?? [],
      lineDetails: body.lineDetails ?? [],
      lineSummary: body.lineSummary ?? [],
      subtotal: Number(body.subtotal) || 0,
      total: Number(body.total) || 0,
      count: Number(body.count) || 0,
      whatsappClicked: Boolean(body.whatsappClicked),
      leadId: body.leadId,
    };

    if (draft.count === 0 && !draft.customer.phone?.trim() && !draft.customer.firstName?.trim()) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    await upsertPackageDraft(draft);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Kayıt başarısız" }, { status: 500 });
  }
}
