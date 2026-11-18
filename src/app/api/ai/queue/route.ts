/** n8n: şu an yapılması gereken aramalar ve WhatsApp mesajları (kurallara uyanlar). */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { buildQueue } from "@/lib/ai-couples/queue";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const limit = Math.min(50, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 20));
  const actions = await buildQueue(new Date(), limit);
  return NextResponse.json({ ok: true, actions });
}
