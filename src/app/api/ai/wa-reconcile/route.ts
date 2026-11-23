/**
 * WhatsApp "kaçanları topla" — elle / n8n'den tetikleme. POST (Bearer AI anahtarı)
 * Gövde: { hours?: 1-240, dry?: true }  → dry: hiçbir şey yazmadan sadece ne bulduğunu döner.
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { reconcileWa, unansweredDigest } from "@/lib/ai-couples/wa-reconcile";
import { rememberLid } from "@/lib/ai-couples/wa-lid";
import { normalizePhone } from "@/lib/ai-couples/rules";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { hours?: unknown; dry?: unknown; lid?: unknown; phone?: unknown; digest?: unknown };
  // Gizli kimliği (…@lid) bilinen bir numaraya elle bağla: { lid, phone }
  const phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");
  if (typeof body.lid === "string" && /^d+@lid$/.test(body.lid) && phone) await rememberLid(body.lid, phone, "elle eşleştirildi");
  if (body.digest === true) return NextResponse.json({ ok: true, lines: await unansweredDigest(true) });
  const hours = Number(body.hours);
  const rep = await reconcileWa({ hours: Number.isFinite(hours) && hours > 0 ? hours : 30, dry: body.dry === true });
  return NextResponse.json(rep, { status: rep.ok ? 200 : 503 });
}
