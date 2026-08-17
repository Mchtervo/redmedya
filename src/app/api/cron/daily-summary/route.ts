import { timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { readAnalyticsEventsInRange } from "@/lib/analytics/analytics-events-store";
import { readAnalyticsSessions } from "@/lib/analytics/analytics-sessions-store";
import {
  buildDailySnapshot,
  formatDailySummaryText,
  istanbulWindowEndingNow,
} from "@/lib/analytics/daily-summary";
import {
  markDailySummarySent,
  wasDailySummarySent,
} from "@/lib/analytics/daily-summary-store";
import { ensureCronSecret } from "@/lib/data-dir";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { readLeads } from "@/lib/leads-store";
import { readVisits } from "@/lib/track/visits-store";

export const dynamic = "force-dynamic";

type ApiResponse<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string } };

function json<T>(body: ApiResponse<T>, status = 200) {
  return NextResponse.json(body, { status });
}

function secretsEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

function authorize(request: NextRequest): boolean {
  const expected = ensureCronSecret();
  if (expected.length < 16) return false;
  const hdr = request.headers.get("authorization") ?? "";
  const bearer = hdr.toLowerCase().startsWith("bearer ")
    ? hdr.slice(7).trim()
    : "";
  const query = request.nextUrl.searchParams.get("secret")?.trim() ?? "";
  const provided = bearer || query;
  if (!provided) return false;
  return secretsEqual(provided, expected);
}

async function leadCountInRange(fromMs: number, toMs: number): Promise<number> {
  const leads = await readLeads();
  return leads.filter((l) => {
    const t = new Date(l.createdAt).getTime();
    return t >= fromMs && t <= toMs;
  }).length;
}

async function snapshotForWindow(fromMs: number, toMs: number, dayKey: string) {
  const [events, sessions, visits] = await Promise.all([
    readAnalyticsEventsInRange(fromMs, toMs),
    readAnalyticsSessions(),
    readVisits(),
  ]);
  const visitCount = visits[dayKey]?.total ?? 0;
  const leadCount = await leadCountInRange(fromMs, toMs);
  const sessionsInRange = sessions.filter((s) => {
    const t = new Date(s.first_seen_at).getTime();
    return t >= fromMs && t <= toMs;
  });
  return buildDailySnapshot({
    events,
    sessions: sessionsInRange,
    visitCount,
    leadCount,
  });
}

async function run(request: NextRequest) {
  if (!authorize(request)) {
    return json(
      {
        success: false,
        error: { code: "unauthorized", message: "Yetkisiz." },
      },
      401
    );
  }

  const now = new Date();
  const todayW = istanbulWindowEndingNow(now, 0);
  const yestW = istanbulWindowEndingNow(now, -1);
  const force = request.nextUrl.searchParams.get("force") === "1";

  if (!force && (await wasDailySummarySent(todayW.dayKey))) {
    return json({
      success: true,
      data: { sent: false, skipped: "already_sent", day: todayW.dayKey },
    });
  }

  const [today, yesterday] = await Promise.all([
    snapshotForWindow(todayW.fromMs, todayW.toMs, todayW.dayKey),
    snapshotForWindow(yestW.fromMs, yestW.toMs, yestW.dayKey),
  ]);
  const text = formatDailySummaryText(today, yesterday, todayW.dayKey);
  const sent = await sendTelegramMessage(text);
  if (!sent) {
    return json(
      {
        success: false,
        error: {
          code: "telegram_failed",
          message: "Telegram gönderilemedi.",
        },
      },
      502
    );
  }
  await markDailySummarySent(todayW.dayKey);
  return json({
    success: true,
    data: { sent: true, day: todayW.dayKey },
  });
}

export async function GET(request: NextRequest) {
  return run(request);
}

export async function POST(request: NextRequest) {
  return run(request);
}
