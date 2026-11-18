/**
 * Aramadan / mesajdan hemen önce son kontrol.
 * GET ?channel=call|whatsapp|sms → { allowed, reason?, capacity? }
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad } from "@/lib/ai-couples/http";
import { getCapacityForDate } from "@/lib/ai-couples/capacity";
import { canContact, type ContactChannel } from "@/lib/ai-couples/rules";
import { getCouple } from "@/lib/ai-couples/store";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const ch = new URL(request.url).searchParams.get("channel") ?? "call";
  if (!["call", "whatsapp", "sms"].includes(ch)) return bad("channel: call | whatsapp | sms");
  const couple = await getCouple((await params).id);
  if (!couple) return bad("Bulunamadı", 404);
  const decision = canContact(couple, ch as ContactChannel);
  const capacity = await getCapacityForDate(couple.weddingDate);
  return NextResponse.json({
    ok: true,
    ...decision,
    couple: { id: couple.id, name: couple.name, phone: couple.phone, weddingDate: couple.weddingDate, source: couple.source, callCount: couple.callCount },
    capacity,
  });
}
