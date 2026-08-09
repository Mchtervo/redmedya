import assert from "node:assert/strict";
import test from "node:test";
import { buildFunnelStages, groupBySession } from "@/lib/analytics/funnel-aggregate";
import type { AnalyticsEvent } from "@/lib/analytics/types";

function ev(
  session_id: string,
  event_name: string,
  n = 1
): AnalyticsEvent[] {
  return Array.from({ length: n }, (_, i) => ({
    id: `${session_id}-${event_name}-${i}`,
    client_event_id: `${session_id}-${event_name}-${i}`,
    session_id,
    event_name,
    event_time: new Date(Date.now() + i).toISOString(),
    page_url: "https://redmediadugun.com/paket-olustur",
    funnel_step: "other",
    metadata: {},
    lead_id: null,
    error_code: null,
    device: "mobile",
    browser: "Chrome",
    os: "iOS",
    utm_source: null,
    utm_campaign: null,
    utm_medium: null,
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
