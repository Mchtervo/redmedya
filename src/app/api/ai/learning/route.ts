/** Asistanın sahibinden öğrendikleri: GET → kurallar + örnek sayısı · POST {action:"reseed"} → örnek bankasını baştan kur (Bearer AI anahtarı) */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { learningStatus, reseedExamples } from "@/lib/ai-couples/wa-learning";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await learningStatus()) });
}

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as { action?: string };
  if (body.action !== "reseed") return NextResponse.json({ ok: false, error: "action: reseed" }, { status: 400 });
  return NextResponse.json({ ok: true, examples: await reseedExamples() });
}
