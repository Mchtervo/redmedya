/** Bekleyen cevap önerileri (Bearer AI anahtarı) — kontrol amaçlı, panel listesinin aynısı */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { listPendingDrafts, rejectDraft } from "@/lib/ai-couples/wa-drafts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, drafts: await listPendingDrafts() });
}

/** POST { action: "cancel", id } — eskimiş öneriyi kapat (Telegram düğmesi de kalkar) */
export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const b = (await request.json().catch(() => ({}))) as { action?: string; id?: string };
  if (b.action !== "cancel" || !b.id) return NextResponse.json({ ok: false }, { status: 400 });
  return NextResponse.json(await rejectDraft(b.id, "telegram"));
}
