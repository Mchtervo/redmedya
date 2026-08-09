import { NextRequest, NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { readAnalyticsEventsInRange } from "@/lib/analytics/analytics-events-store";
import { readAnalyticsSessions } from "@/lib/analytics/analytics-sessions-store";
import { readTechErrors } from "@/lib/analytics/tech-errors-store";
import {
  biggestDropOff,
  buildDropOffBuckets,
  buildFunnelStages,
  campaignFunnel,
  deviceFunnel,
  formErrorStats,
  groupBySession,
  healthSummary,
  osFunnel,
  recentActivity,
  resolveDateRange,
  stepDurations,
  trafficSourceLabel,
} from "@/lib/analytics/funnel-aggregate";
import type { DateRangePreset } from "@/lib/analytics/types";

export async function GET(request: NextRequest) {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;

  const sp = request.nextUrl.searchParams;
  const view = sp.get("view") ?? "dashboard";
  const preset = (sp.get("range") ?? "last_7") as DateRangePreset;
  const { fromMs, toMs, label } = resolveDateRange(
    preset,
    sp.get("from") ?? undefined,
    sp.get("to") ?? undefined
  );

  const utmSource = sp.get("utm_source");
  const utmCampaign = sp.get("utm_campaign");
  const deviceFilter = sp.get("device");
  const convertedFilter = sp.get("converted"); // yes|no|all

  let events = await readAnalyticsEventsInRange(fromMs, toMs);
  const allSessions = await readAnalyticsSessions();
  const sessionsMeta = new Map(allSessions.map((s) => [s.session_id, s]));

  if (utmSource) {
    events = events.filter((e) => (e.utm_source ?? "") === utmSource);
  }
  if (utmCampaign) {
    events = events.filter((e) => (e.utm_campaign ?? "") === utmCampaign);
  }
  if (deviceFilter) {
    events = events.filter((e) => (e.device ?? "") === deviceFilter);
  }

  let bySession = groupBySession(events);

  if (convertedFilter === "yes" || convertedFilter === "no") {
    const want = convertedFilter === "yes";
    bySession = new Map(
      [...bySession.entries()].filter(([sid, evs]) => {
        const meta = sessionsMeta.get(sid);
        const conv =
          meta?.converted ||
          evs.some((e) => e.event_name === "Schedule");
        return conv === want;
      })
    );
  }

  if (view === "session") {
    const sid = sp.get("session");
    if (!sid) {
      return NextResponse.json({ error: "session gerekli" }, { status: 400 });
    }
    const timeline = events
      .filter((e) => e.session_id === sid)
      .sort(
        (a, b) =>
          new Date(a.event_time).getTime() - new Date(b.event_time).getTime()
      );
    const meta = sessionsMeta.get(sid) ?? null;
    const abandoned =
      meta &&
      !meta.converted &&
      !timeline.some((e) => e.event_name === "Schedule");
    return NextResponse.json({
      session: meta,
      timeline,
      abandoned,
      last_step: timeline[timeline.length - 1]?.event_name ?? null,
    });
  }

  if (view === "errors") {
    const tech = await readTechErrors();
    return NextResponse.json({
      range: { preset, label, fromMs, toMs },
      form_errors: formErrorStats(events),
      tech_errors: tech.slice(0, 100),
    });
  }

  const stages = buildFunnelStages(bySession);
  const drop = buildDropOffBuckets(bySession, sessionsMeta);
  const campaigns = campaignFunnel(bySession, sessionsMeta);
  const devices = deviceFunnel(bySession);
  const os = osFunnel(bySession);
  const durations = stepDurations(bySession);
  const activity = recentActivity(events);
  const biggest = biggestDropOff(stages);

  // Önceki 7 gün rezervasyon oranı (uyarı için)
  const prev = resolveDateRange("last_7");
  const prevEvents = await readAnalyticsEventsInRange(prev.fromMs, prev.toMs);
  const prevStages = buildFunnelStages(groupBySession(prevEvents));
  const prevPage = prevStages.find((s) => s.key === "page")?.count ?? 0;
  const prevRes = prevStages.find((s) => s.key === "reserved")?.count ?? 0;
  const prevRate = prevPage ? prevRes / prevPage : null;
  const health = healthSummary(stages, prevRate);

  const android = os.find((o) => o.os === "Android");
  const iphone = os.find((o) => o.os === "iOS");
  if (
    android &&
    iphone &&
    iphone.rate > 0 &&
    android.rate < iphone.rate * 0.4 &&
    android.page >= 20
  ) {
    health.alerts.push(
      "Android kullanıcılarında rezervasyon oranı iOS’a göre belirgin düşük — checkout drop-off kontrol edin."
    );
  }

  const traffic = new Map<string, number>();
  for (const [, evs] of bySession) {
    const src = trafficSourceLabel(
      sessionsMeta.get(evs[0].session_id)?.utm.utm_source ?? evs[0].utm_source
    );
    traffic.set(src, (traffic.get(src) ?? 0) + 1);
  }

  const sessionList = [...bySession.entries()]
    .map(([id, evs]) => {
      const meta = sessionsMeta.get(id);
      return {
        session_id: id,
        first: evs[0]?.event_time,
        last: evs[evs.length - 1]?.event_time,
        events: evs.length,
        max_step: meta?.max_funnel_step ?? evs[evs.length - 1]?.funnel_step,
        converted: Boolean(
          meta?.converted || evs.some((e) => e.event_name === "Schedule")
        ),
        device: meta?.device ?? evs[0]?.device,
        os: meta?.os ?? evs[0]?.os,
        source: trafficSourceLabel(meta?.utm.utm_source ?? evs[0]?.utm_source),
        campaign: meta?.utm.utm_campaign ?? evs[0]?.utm_campaign,
        lead_id: meta?.lead_id ?? evs.find((e) => e.lead_id)?.lead_id ?? null,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.last ?? 0).getTime() - new Date(a.last ?? 0).getTime()
    )
    .slice(0, 200);

  return NextResponse.json({
    range: { preset, label, fromMs, toMs },
    health,
    stages,
    biggest_drop: biggest,
    drop_off: drop,
    campaigns,
    devices,
    os,
    durations,
    activity,
    traffic: [...traffic.entries()].map(([name, count]) => ({ name, count })),
    sessions: sessionList,
    form_errors: formErrorStats(events),
  });
}
