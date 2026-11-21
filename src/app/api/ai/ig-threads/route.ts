/** Instagram DM sohbetleri (Bearer AI anahtarı): GET kısa durum · POST { igsid, action: "resume" } asistan beklemesini kaldır */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { importConversation, redoThread, replyPending, resumeThread, threadsOverview, waOpenerNow } from "@/lib/ai-couples/ig-agent";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, threads: await threadsOverview(100) });
}

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { igsid?: string; action?: string };
  if (body.action === "reply-pending") return NextResponse.json({ ok: true, replied: await replyPending() });
  if (body.action === "wa-opener" && body.igsid) return NextResponse.json({ ok: await waOpenerNow(body.igsid, (body as { prefersWa?: boolean }).prefersWa === true) });
  if (body.action === "redo" && body.igsid) return NextResponse.json({ ok: true, cancelled: await redoThread(body.igsid) });
  if (body.action === "import" && body.igsid) return NextResponse.json({ ok: true, ...(await importConversation(body.igsid, (body as { draft?: boolean }).draft !== false)) });
  if (body.action !== "resume" || !body.igsid) return NextResponse.json({ ok: false, error: "igsid + action: resume" }, { status: 400 });
  return NextResponse.json({ ok: await resumeThread(body.igsid) });
}
