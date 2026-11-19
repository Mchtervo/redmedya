/**
 * Admin: sesli asistan TEST araması.
 * POST { phone, name? } → numarayı hemen arar; gerçek akış gibi analiz + kişisel WhatsApp teklifi (test çifti istatistiğe sayılmaz)
 * GET → son test aramaları (durum, süre, özet, konuşma metni). Ses kaydı: /api/admin/ai-recording/{id}
 */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { normalizePhone } from "@/lib/ai-couples/rules";
import { readTestCalls, startTestCall, testCallDetail } from "@/lib/ai-couples/test-calls";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const list = (await readTestCalls()).slice(0, 8);
  const calls = await Promise.all(list.map((r) => testCallDetail(r)));
  return NextResponse.json({ ok: true, calls });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  const phone = normalizePhone(str(body?.phone, 40));
  if (!phone) return bad("Geçerli bir cep telefonu girin (05xx xxx xx xx)");
  const r = await startTestCall({ phone, name: str(body?.name, 60) });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true, call: r.record });
}
