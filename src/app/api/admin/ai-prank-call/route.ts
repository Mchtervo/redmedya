/**
 * Admin: 🎭 şaka araması (sahibinin yakınlarına). Müşteri akışından ayrı — çift kaydı açmaz, WhatsApp göndermez.
 * GET → son şaka aramaları + bugünkü sayı. POST { phone, name?, mode, duration, topic? } → hemen arar.
 */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { normalizePhone } from "@/lib/ai-couples/rules";
import { PRANK_DAILY_LIMIT, PRANK_DURATIONS, PRANK_MODES, prankCountToday, prankDetail, readPranks, startPrank, type PrankDuration, type PrankMode } from "@/lib/ai-couples/prank-calls";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const list = (await readPranks()).slice(0, 6);
  return NextResponse.json({ ok: true, calls: await Promise.all(list.map((r) => prankDetail(r))), today: await prankCountToday(), limit: PRANK_DAILY_LIMIT });
}

export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  const phone = normalizePhone(str(body?.phone, 40));
  if (!phone) return bad("Geçerli bir cep telefonu girin (05xx xxx xx xx)");
  const mode = (PRANK_MODES as readonly string[]).includes(String(body?.mode)) ? (body!.mode as PrankMode) : "esprili";
  const duration = (PRANK_DURATIONS as readonly string[]).includes(String(body?.duration)) ? (body!.duration as PrankDuration) : "normal";
  const r = await startPrank({ phone, name: str(body?.name, 40), mode, duration, topic: str(body?.topic, 400) });
  if (!r.ok) return NextResponse.json({ ok: false, error: r.error }, { status: 502 });
  return NextResponse.json({ ok: true, call: r.record });
}
