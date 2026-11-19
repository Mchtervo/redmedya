/** Admin: otomasyon hız ayarları (WhatsApp kampanya / sesli arama). n8n bunları /api/ai/queue ve /api/ai/couples cevabından okur. */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { bad, readJson } from "@/lib/ai-couples/http";
import { cleanAutomation, readAutomation, writeAutomation } from "@/lib/ai-couples/automation";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: true, automation: await readAutomation() });
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const saved = await writeAutomation(cleanAutomation(body, await readAutomation()));
  return NextResponse.json({ ok: true, automation: saved });
}
