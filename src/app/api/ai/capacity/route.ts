/**
 * Sesli asistan / n8n: AYLIK gerçek kontenjan.
 * GET ?date=YYYY-MM-DD → o ayın kontenjanı · GET → önümüzdeki 14 ay
 * PUT { defaultPerMonth?, months?, manualBooked? } → kapasite ayarı (anahtarlar YYYY-MM)
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson } from "@/lib/ai-couples/http";
import {
  cleanGiftLeft,
  cleanMonthMap,
  getCapacityForDate,
  readCapacityConfig,
  upcomingCapacity,
  writeCapacityConfig,
} from "@/lib/ai-couples/capacity";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const date = new URL(request.url).searchParams.get("date");
  if (date) return NextResponse.json({ ok: true, capacity: await getCapacityForDate(date) });
  const cfg = await readCapacityConfig();
  return NextResponse.json({ ok: true, months: await upcomingCapacity(14, cfg), droneGiftLeft: cfg.droneGiftLeft });
}

export async function PUT(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const cur = await readCapacityConfig();
  const def = Number(body.defaultPerMonth);
  await writeCapacityConfig({
    defaultPerMonth: body.defaultPerMonth !== undefined && Number.isFinite(def) && def >= 0 && def <= 200 ? Math.round(def) : cur.defaultPerMonth,
    months: body.months !== undefined ? { ...cur.months, ...cleanMonthMap(body.months) } : cur.months,
    manualBooked: body.manualBooked !== undefined ? { ...cur.manualBooked, ...cleanMonthMap(body.manualBooked) } : cur.manualBooked,
    droneGiftLeft: cleanGiftLeft(body.droneGiftLeft, cur.droneGiftLeft),
    updatedAt: cur.updatedAt,
  });
  const cfg = await readCapacityConfig();
  return NextResponse.json({ ok: true, months: await upcomingCapacity(14, cfg), droneGiftLeft: cfg.droneGiftLeft });
}
