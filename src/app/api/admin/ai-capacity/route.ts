import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { readCapacityConfig, upcomingCapacity, writeCapacityConfig } from "@/lib/ai-couples/capacity";
import { bad, readJson } from "@/lib/ai-couples/http";

export const dynamic = "force-dynamic";

function cleanMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    const num = Number(n);
    if (/^\d{4}-W\d{2}$/.test(k) && Number.isFinite(num) && num >= 0 && num <= 50) out[k] = Math.round(num);
  }
  return out;
}

export async function PUT(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const cur = await readCapacityConfig();
  const def = Number(body.defaultPerWeek);
  await writeCapacityConfig({
    defaultPerWeek: Number.isFinite(def) && def >= 0 && def <= 50 ? Math.round(def) : cur.defaultPerWeek,
    weeks: body.weeks !== undefined ? cleanMap(body.weeks) : cur.weeks,
    manualBooked: body.manualBooked !== undefined ? cleanMap(body.manualBooked) : cur.manualBooked,
    updatedAt: cur.updatedAt,
  });
  return NextResponse.json({ ok: true, capacityConfig: await readCapacityConfig(), weeks: await upcomingCapacity(12) });
}
