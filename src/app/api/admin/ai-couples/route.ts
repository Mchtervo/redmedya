import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { siteConfig } from "@/config/site";
import { getAiApiToken } from "@/lib/ai-couples/auth";
import { bookedByDay, readCapacityConfig, upcomingCapacity } from "@/lib/ai-couples/capacity";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { ingestCouple, readCouples } from "@/lib/ai-couples/store";
import { reloadPersistentEnv } from "@/lib/data-dir";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  reloadPersistentEnv();
  const [couples, capacityConfig, months, byDay] = await Promise.all([
    readCouples(),
    readCapacityConfig(),
    upcomingCapacity(14),
    bookedByDay(),
  ]);
  return NextResponse.json({
    couples,
    capacityConfig,
    months,
    /** Takvimdeki rezervasyon günleri → o gün kaç düğün (panelde "tarih dolu mu" için) */
    bookedDays: Object.fromEntries(byDay),
    integration: {
      baseUrl: siteConfig.url,
      apiToken: getAiApiToken(),
      telegramReady: Boolean(process.env.TELEGRAM_BOT_TOKEN?.trim() && process.env.TELEGRAM_CHAT_ID?.trim()),
    },
  });
}

/** Panelden elle çift ekleme */
export async function POST(request: Request) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const result = await ingestCouple({
    name: str(body.name, 120),
    phone: str(body.phone, 40) ?? "",
    weddingDate: str(body.weddingDate, 20),
    source: "manual",
    note: str(body.note, 1000),
  });
  if (!result.ok) return bad(result.error, 422);
  return NextResponse.json({ ok: true, created: result.created, couple: result.couple });
}
