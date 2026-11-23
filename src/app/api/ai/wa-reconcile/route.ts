/**
 * WhatsApp "kaçanları topla" — elle / n8n'den tetikleme. POST (Bearer AI anahtarı)
 * Gövde: { hours?: 1-240, dry?: true }  → dry: hiçbir şey yazmadan sadece ne bulduğunu döner.
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { reconcileWa } from "@/lib/ai-couples/wa-reconcile";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { hours?: unknown; dry?: unknown };
  const hours = Number(body.hours);
  const rep = await reconcileWa({ hours: Number.isFinite(hours) && hours > 0 ? hours : 30, dry: body.dry === true });
  return NextResponse.json(rep, { status: rep.ok ? 200 : 503 });
}
