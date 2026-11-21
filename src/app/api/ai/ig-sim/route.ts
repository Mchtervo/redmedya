/** Deneme: Instagram asistanının cevabını üretir, HİÇBİR ŞEY göndermez (Bearer AI anahtarı) */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { simulateIg } from "@/lib/ai-couples/ig-agent";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as Parameters<typeof simulateIg>[0];
  if (!Array.isArray(body.messages) || !body.messages.length) return NextResponse.json({ ok: false, error: "messages" }, { status: 400 });
  return NextResponse.json({ ok: true, ...(await simulateIg(body)) });
}
