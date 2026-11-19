import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { cleanBlockedDates, cleanGiftLeft, cleanMonthMap, cleanPerDay, readCapacityConfig, upcomingCapacity, writeCapacityConfig } from "@/lib/ai-couples/capacity";
import { bad, readJson } from "@/lib/ai-couples/http";

export const dynamic = "force-dynamic";

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const cur = await readCapacityConfig();
  const def = Number(body.defaultPerMonth);
  await writeCapacityConfig({
    defaultPerMonth: Number.isFinite(def) && def >= 0 && def <= 200 ? Math.round(def) : cur.defaultPerMonth,
    months: body.months !== undefined ? cleanMonthMap(body.months) : cur.months,
    manualBooked: body.manualBooked !== undefined ? cleanMonthMap(body.manualBooked) : cur.manualBooked,
    droneGiftLeft: cleanGiftLeft(body.droneGiftLeft, cur.droneGiftLeft),
    perDay: cleanPerDay(body.perDay, cur.perDay ?? 1),
    blockedDates: body.blockedDates !== undefined ? cleanBlockedDates(body.blockedDates) : cur.blockedDates,
    updatedAt: cur.updatedAt,
  });
  return NextResponse.json({ ok: true, capacityConfig: await readCapacityConfig(), months: await upcomingCapacity(14) });
}
