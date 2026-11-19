/** n8n → sahibine Telegram bildirimi. POST { text } (Bearer AI anahtarı) */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { sendTelegramMessage } from "@/lib/lead-notify";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  const text = str(body?.text, 3500);
  if (!text) return bad("text zorunlu");
  const sent = await sendTelegramMessage(text).catch(() => false);
  return NextResponse.json({ ok: sent }, { status: sent ? 200 : 502 });
}
