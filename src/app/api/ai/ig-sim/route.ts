/** Deneme: Instagram asistanının cevabını üretir, HİÇBİR ŞEY göndermez (Bearer AI anahtarı) */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { simulateIg } from "@/lib/ai-couples/ig-agent";
import { generateWaOpener } from "@/lib/ai-couples/wa-agent";
import { getCouple } from "@/lib/ai-couples/store";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = (await request.json().catch(() => ({}))) as Parameters<typeof simulateIg>[0] & { opener?: { coupleId: string; context: string } };
  // WhatsApp ilk mesaj denemesi (göndermez)
  if (body.opener?.coupleId) {
    const c = await getCouple(body.opener.coupleId);
    if (!c) return NextResponse.json({ ok: false, error: "çift yok" }, { status: 404 });
    return NextResponse.json({ ok: true, text: await generateWaOpener(c, body.opener.context ?? "") });
  }
  if (!Array.isArray(body.messages) || !body.messages.length) return NextResponse.json({ ok: false, error: "messages" }, { status: 400 });
  return NextResponse.json({ ok: true, ...(await simulateIg(body)) });
}
