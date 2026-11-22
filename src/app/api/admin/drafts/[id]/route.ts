/** Panel: öneriyi gönder (istersen düzenleyerek) ya da kapat. Telegram tarafı da güncellenir. */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { approveDraft, rejectDraft } from "@/lib/ai-couples/wa-drafts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Ctx) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const id = (await params).id;
  const body = (await request.json().catch(() => ({}))) as { action?: string; text?: string };
  if (body.action === "cancel") {
    const r = await rejectDraft(id, "panel");
    return NextResponse.json(r, { status: r.ok ? 200 : 409 });
  }
  if (body.action !== "send") return NextResponse.json({ ok: false, msg: "action: send | cancel" }, { status: 400 });
  const text = typeof body.text === "string" && body.text.trim() ? body.text : undefined;
  const r = await approveDraft(id, { text, via: "panel" });
  return NextResponse.json({ ok: r.ok, msg: r.msg }, { status: r.ok ? 200 : 409 });
}
