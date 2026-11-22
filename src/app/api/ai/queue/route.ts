/** n8n: şu an yapılması gereken aramalar ve WhatsApp mesajları (kurallara uyanlar). */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { buildQueue } from "@/lib/ai-couples/queue";
import { readAutomation } from "@/lib/ai-couples/automation";
import { remindStaleDrafts } from "@/lib/ai-couples/wa-drafts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const limit = Math.min(50, Math.max(1, Number(new URL(request.url).searchParams.get("limit")) || 20));
  const actions = await buildQueue(new Date(), limit);
  // Onay bekleyen cevap önerileri 45 dk'yı geçtiyse sahibine hatırlat (bir kez)
  void remindStaleDrafts().catch(() => 0);
  // automation: arama otomasyonu (n8n A) günlük sınır ve arama arası süreyi buradan okur
  return NextResponse.json({ ok: true, actions, automation: await readAutomation() });
}
