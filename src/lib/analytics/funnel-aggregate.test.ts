import assert from "node:assert/strict";
import test from "node:test";
import { buildFunnelStages, buildDropOffBuckets, groupBySession, activeDwellSec } from "@/lib/analytics/funnel-aggregate";
import type { AnalyticsEvent } from "@/lib/analytics/types";

function ev(
  session_id: string,
  event_name: string,
  n = 1,
  extra?: Partial<AnalyticsEvent>
): AnalyticsEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${session_id}-${event_name}-${i}`,
    client_event_id: `${session_id}-${event_name}-${i}`,
    session_id,
    event_name,
    event_time: extra?.event_time ?? new Date(Date.now() + i).toISOString(),
    page_url: extra?.page_url ?? "https://redmediadugun.com/paket-olustur",
    funnel_step: extra?.funnel_step ?? "other",
    metadata: extra?.metadata ?? {},
    lead_id: null,
    error_code: null,
    device: "mobile",
    browser: "Chrome",
    os: "iOS",
    utm_source: null,
    utm_campaign: null,
    utm_medium: null,
    utm_content: null,
  }));
}

test("aynı session tekrar PageView → 1 değil, ViewContent bazlı funnel", () => {
  const events = [
    ...ev("s1", "PageView", 4),
    ...ev("s1", "ViewContent", 1),
    ...ev("s1", "PackageBuild", 1),
    ...ev("s1", "AddToCart", 1),
    ...ev("s1", "InitiateCheckout", 2),
    ...ev("s1", "Schedule", 1),
  ];
  const stages = buildFunnelStages(groupBySession(events));
  const byKey = Object.fromEntries(stages.map((s) => [s.key, s.count]));
  assert.equal(byKey.page, 1);
  assert.equal(byKey.started, 1);
  assert.equal(byKey.ready, 1);
  assert.equal(byKey.form, 1); // 2x InitiateCheckout → 1
  assert.equal(byKey.reserved, 1);
});

test("timeline için event sayısı korunur (groupBySession)", () => {
  const events = [
    ...ev("s1", "InitiateCheckout", 2),
    ...ev("s1", "ViewContent", 1),
  ];
  const by = groupBySession(events);
  assert.equal(by.get("s1")?.length, 3);
});

test("aktif kalma: 8 dk arka plan boşluğu dahil edilmez", () => {
  const t0 = Date.parse("2026-08-17T20:00:00.000Z");
  const events = [
    ...ev("s1", "ViewContent", 1, {
      event_time: new Date(t0).toISOString(),
    }),
    ...ev("s1", "PackageSelected", 1, {
      event_time: new Date(t0 + 12_000).toISOString(),
    }),
    ...ev("s1", "PageLeave", 1, {
      event_time: new Date(t0 + 8 * 60_000 + 59_000).toISOString(),
      metadata: { dwell_ms: 8 * 60_000 + 59_000 },
    }),
  ];
  assert.equal(activeDwellSec(events), 12);
});

test("aktif kalma: active_ms varsa duvar saati değil o kullanılır", () => {
  const t0 = Date.parse("2026-08-17T20:00:00.000Z");
  const events = [
    ...ev("s1", "ViewContent", 1, {
      event_time: new Date(t0).toISOString(),
    }),
    ...ev("s1", "PageLeave", 1, {
      event_time: new Date(t0 + 600_000).toISOString(),
      metadata: { dwell_ms: 600_000, active_ms: 18_000 },
    }),
  ];
  assert.equal(activeDwellSec(events), 18);
});

test("DEVAM'a basmadan çıkanlar — ön seçili paket tıklanmasa da gruba girer", () => {
  const events = [
    ...ev("s1", "ViewContent", 1),
    ...ev("s1", "PackageSelected", 1),
  ];
  const drop = buildDropOffBuckets(groupBySession(events), new Map());
  const noContinue = drop.find((d) => d.key === "no_continue");
  assert.equal(noContinue?.label, "DEVAM'a basmadan çıkanlar");
  assert.equal(noContinue?.count, 1);
});

test("AddToCart (DEVAM) varsa no_continue sayılmaz", () => {
  const events = [
    ...ev("s1", "ViewContent", 1),
    ...ev("s1", "PackageSelected", 1),
    ...ev("s1", "AddToCart", 1),
  ];
  const drop = buildDropOffBuckets(groupBySession(events), new Map());
  const noContinue = drop.find((d) => d.key === "no_continue");
  assert.equal(noContinue?.count, 0);
});
