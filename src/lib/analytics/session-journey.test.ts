import assert from "node:assert/strict";
import test from "node:test";
import type { AnalyticsEvent } from "@/lib/analytics/types";
import {
  adCampaignBucket,
  appendPageSequence,
  inferBlockReason,
  pathFromUrl,
  summarizeJourney,
} from "@/lib/analytics/session-journey";

function ev(
  partial: Partial<AnalyticsEvent> & { event_name: string; event_time: string }
): AnalyticsEvent {
  return {
    id: partial.id ?? "id",
    client_event_id: partial.client_event_id ?? "ce",
    session_id: partial.session_id ?? "s1",
    event_name: partial.event_name,
    event_time: partial.event_time,
    page_url: partial.page_url ?? "https://redmediadugun.com/",
    funnel_step: partial.funnel_step ?? "page",
    metadata: partial.metadata ?? {},
    lead_id: null,
    error_code: partial.error_code ?? null,
    device: "mobile",
    browser: "Chrome",
    os: "Android",
    utm_source: "facebook",
    utm_campaign: partial.utm_campaign ?? "SITE_ankara",
    utm_medium: "paid",
    utm_content: partial.utm_content ?? "carousel",
  };
}

test("kampanya kovası SITE / DM / SICAK", () => {
  assert.equal(adCampaignBucket("SITE_2026", null), "SITE");
  assert.equal(adCampaignBucket("dm-remarketing", null), "DM");
  assert.equal(adCampaignBucket("SICAK-ankara", "x"), "SICAK");
  assert.equal(adCampaignBucket("organic", null), "diger");
});

test("pathFromUrl sorgu dizesini atar", () => {
  assert.equal(
    pathFromUrl("https://redmediadugun.com/paket-olustur?p=2"),
    "/paket-olustur"
  );
  assert.equal(pathFromUrl("/galeri"), "/galeri");
});

test("page sequence tekrarlayan path'i birleştirmez, sırayı korur", () => {
  assert.deepEqual(appendPageSequence([], "/"), ["/"]);
  assert.deepEqual(appendPageSequence(["/"], "/"), ["/"]);
  assert.deepEqual(appendPageSequence(["/"], "/galeri"), ["/", "/galeri"]);
});

test("form hatasında blok sebebi form_error", () => {
  const events = [
    ev({
      event_name: "PageView",
      event_time: "2026-08-17T10:00:00.000Z",
      funnel_step: "page",
    }),
    ev({
      event_name: "FormFieldError",
      event_time: "2026-08-17T10:01:00.000Z",
      funnel_step: "checkout",
      metadata: { field_name: "phone", error_type: "required" },
    }),
    ev({
      event_name: "PageLeave",
      event_time: "2026-08-17T10:01:10.000Z",
      funnel_step: "other",
    }),
  ];
  const block = inferBlockReason(events, false);
  assert.equal(block.reason, "form_error");
  assert.equal(block.last_completed_step, "checkout");
  assert.match(block.label ?? "", /form hatası/);
});

test("geri tuşu son olaysa block=back", () => {
  const events = [
    ev({
      event_name: "StepForward",
      event_time: "2026-08-17T10:00:00.000Z",
      funnel_step: "package_build",
    }),
    ev({
      event_name: "StepBack",
      event_time: "2026-08-17T10:00:05.000Z",
      funnel_step: "other",
    }),
  ];
  assert.equal(inferBlockReason(events, false).reason, "back");
});

test("dönüşümde blok yok", () => {
  const events = [
    ev({
      event_name: "Schedule",
      event_time: "2026-08-17T10:00:00.000Z",
      funnel_step: "schedule",
    }),
  ];
  assert.equal(inferBlockReason(events, true).reason, null);
});

test("özet landing/exit ve SITE kovası", () => {
  const events = [
    ev({
      event_name: "PageView",
      event_time: "2026-08-17T10:00:00.000Z",
      page_url: "https://redmediadugun.com/",
    }),
    ev({
      event_name: "PageView",
      event_time: "2026-08-17T10:00:20.000Z",
      page_url: "https://redmediadugun.com/galeri",
    }),
  ];
  const sum = summarizeJourney(events, null);
  assert.equal(sum.landing_path, "/");
  assert.equal(sum.exit_path, "/galeri");
  assert.equal(sum.ad_bucket, "SITE");
  assert.equal(sum.pages.length, 2);
  assert.equal(sum.pages[0]?.dwell_sec, 20);
});
