/** Sesli asistan: düğün tarihinin haftasındaki GERÇEK kalan kontenjan. GET ?date=YYYY-MM-DD */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { getCapacityForDate, upcomingCapacity } from "@/lib/ai-couples/capacity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const date = new URL(request.url).searchParams.get("date");
  if (date) return NextResponse.json({ ok: true, capacity: await getCapacityForDate(date) });
  return NextResponse.json({ ok: true, months: await upcomingCapacity(14) });
}
