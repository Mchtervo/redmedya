import assert from "node:assert/strict";
import test from "node:test";
import type { AnalyticsEvent, AnalyticsSession } from "@/lib/analytics/types";
import {
  buildDailySnapshot,
  formatDailySummaryText,
  formatDelta,
  istanbulWindowEndingNow,
} from "@/lib/analytics/daily-summary";

function ev(
  session: string,
  name: string,
  extras?: Partial<AnalyticsEvent>
): AnalyticsEvent {
  return {
    id: `${session}-${name}`,
    client_event_id: `${session}-${name}`,
    session_id: session,
    event_name: name,
    event_time: "2026-08-17T10:00:00.000Z",
    page_url: "https://redmediadugun.com/paket-olustur",
    funnel_step: "other",
    metadata: {},
    lead_id: null,
    error_code: null,
    device: "mobile",
    browser: "Safari",
    os: "iOS",
    utm_source: "facebook",
    utm_campaign: extras?.utm_campaign ?? "SITE-ankara",
    utm_medium: "cpc",
    utm_content: extras?.utm_content ?? null,
    ...extras,
  };
}

test("yüzde kıyas dün 0 ise yeni, eşitse 0", () => {
  assert.equal(formatDelta(5, 0), "↑yeni");
  assert.equal(formatDelta(0, 0), "→0%");
  assert.equal(formatDelta(12, 10), "↑20%");
  assert.equal(formatDelta(8, 10), "↓20%");
});

test("istanbul penceresi bugün gece yarısından şimdiye", () => {
  const now = new Date("2026-08-17T18:00:00.000Z"); // 21:00 TR
  const today = istanbulWindowEndingNow(now, 0);
  const yest = istanbulWindowEndingNow(now, -1);
  assert.equal(today.dayKey, "2026-08-17");
  assert.equal(yest.dayKey, "2026-08-16");
  assert.equal(today.fromMs, new Date("2026-08-17T00:00:00+03:00").getTime());
  assert.equal(yest.fromMs, new Date("2026-08-16T00:00:00+03:00").getTime());
  assert.equal(today.toMs, now.getTime());
});

test("snapshot paket / lead / WA / SITE kovası", () => {
  const events: AnalyticsEvent[] = [
    ev("a", "ViewContent"),
    ev("a", "PackageSelected", { metadata: { package_id: 2 } }),
    ev("a", "PlatoSelected", { metadata: { plato: "no25" } }),
    ev("a", "ExtraServiceSelected", { metadata: { addon_id: "drone" } }),
    ev("a", "WhatsAppClick"),
    ev("a", "Schedule"),
    ev("b", "ViewContent", { utm_campaign: "SICAK-reels" }),
    ev("b", "PackageSelected", {
      metadata: { package_id: 2 },
      utm_campaign: "SICAK-reels",
    }),
  ];
  const snap = buildDailySnapshot({
    events,
    sessions: [],
    visitCount: 0,
    leadCount: 1,
  });
  assert.equal(snap.visitors, 2);
  assert.equal(snap.packagesBuilt, 2);
  assert.equal(snap.leads, 1);
  assert.equal(snap.whatsappClicks, 1);
  assert.equal(snap.topPackage?.label.includes("2") || snap.topPackage?.count === 2, true);
  assert.equal(snap.adBuckets.SITE, 1);
  assert.equal(snap.adBuckets.SICAK, 1);
});

test("özet metni dün kıyası ve reklam satırı içerir", () => {
  const today = buildDailySnapshot({
    events: [
      ev("a", "ViewContent"),
      ev("a", "PackageSelected", { metadata: { package_id: 1 } }),
    ],
    sessions: [] as AnalyticsSession[],
    visitCount: 10,
    leadCount: 2,
  });
  const yesterday = buildDailySnapshot({
    events: [ev("z", "ViewContent")],
    sessions: [],
    visitCount: 5,
    leadCount: 1,
  });
  const text = formatDailySummaryText(today, yesterday, "2026-08-17");
  assert.match(text, /Günlük özet — 17\.08\.2026/);
  assert.match(text, /ziyaretçi/);
  assert.match(text, /paket kuruldu/);
  assert.match(text, /lead/);
  assert.match(text, /WhatsApp tık/);
  assert.match(text, /SITE/);
  assert.match(text, /SICAK/);
  assert.match(text, /En büyük kayıp/);
});
