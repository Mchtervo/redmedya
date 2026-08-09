/**
 * Analytics collect / funnel / attribution birim testleri.
 * Çalıştır: npx tsx --test src/lib/analytics/collect-core.test.ts
 */
import assert from "node:assert/strict";
import test from "node:test";
import {
  ALLOWED_ANALYTICS_EVENTS,
  computeUniqueFunnelCounts,
  isAllowedEventName,
  LIMITS,
  mergeAttribution,
  normalizeCollectEvents,
  rateLimitAllow,
  sanitizeEventMetadata,
  sanitizeTechMessage,
  type RateBucket,
} from "@/lib/analytics/collect-core";

test("bilinmeyen event kabul edilmez", () => {
  assert.equal(isAllowedEventName("Purchase"), false);
  assert.equal(isAllowedEventName("Lead"), false);
  assert.equal(isAllowedEventName("PageView"), true);
  assert.equal(ALLOWED_ANALYTICS_EVENTS.has("SessionAbandoned"), false);
});

test("duplicate client_event_id ikinci kez yazılmaz", () => {
  const seen = new Set<string>();
  const first = normalizeCollectEvents(
    [
      {
        event_name: "PageView",
        client_event_id: "id-1",
        page_url: "https://example.com/",
      },
    ],
    seen
  );
  assert.equal(first.accepted.length, 1);

  const second = normalizeCollectEvents(
    [
      {
        event_name: "PageView",
        client_event_id: "id-1",
        page_url: "https://example.com/",
      },
    ],
    seen
  );
  assert.equal(second.accepted.length, 0);
  assert.ok(
    second.rejected.some((r) => r.reason === "duplicate_client_event_id")
  );
});

test("aşırı büyük metadata reddedilir", () => {
  const huge = { blob: "x".repeat(LIMITS.metadataJsonMax + 50) };
  const res = sanitizeEventMetadata("PackageSelected", huge);
  assert.equal(res.ok, false);
  if (!res.ok) assert.equal(res.reason, "metadata_too_large");
});

test("FormFieldError PII engeli — yalnızca field_name + error_type", () => {
  const res = sanitizeEventMetadata("FormFieldError", {
    field_name: "phone",
    error_type: "invalid",
    value: "05551234567",
    email: "a@b.com",
    name: "Ali",
  });
  assert.equal(res.ok, true);
  if (res.ok) {
    assert.deepEqual(res.metadata, {
      field_name: "phone",
      error_type: "invalid",
    });
  }
});

test("TechError sanitize — token / e-posta / telefon", () => {
  const msg = sanitizeTechMessage(
    "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.abc.def failed for ali@mail.com 05551234567"
  );
  assert.ok(!/Bearer eyJ/i.test(msg));
  assert.ok(!/ali@mail\.com/i.test(msg));
  assert.ok(!/05551234567/.test(msg));
  assert.match(msg, /\[redacted\]/);
});

test("unique-session funnel — tekrar PageView / InitiateCheckout şişirmez", () => {
  const counts = computeUniqueFunnelCounts([
    {
      events: [
        "ViewContent",
        "PageView",
        "PageView",
        "PageView",
        "PageView",
        "PackageBuild",
        "AddToCart",
        "InitiateCheckout",
        "InitiateCheckout",
        "Schedule",
      ],
    },
    {
      events: ["ViewContent", "PackageBuild"],
    },
    {
      events: ["PageView"], // ViewContent yok → funnel'a girmez
    },
  ]);
  assert.equal(counts.viewContent, 2);
  assert.equal(counts.packageBuild, 2);
  assert.equal(counts.addToCart, 1);
  assert.equal(counts.initiateCheckout, 1);
  assert.equal(counts.schedule, 1);
});

test("first-touch korunur; last-touch yeni UTM ile güncellenir", () => {
  const first = mergeAttribution({
    firstIncoming: {
      utm_source: "facebook",
      utm_campaign: "spring",
    },
    lastIncoming: {
      utm_source: "facebook",
      utm_campaign: "spring",
    },
  });
  assert.equal(first.first_touch_utm.utm_campaign, "spring");

  const second = mergeAttribution({
    prevFirst: first.first_touch_utm,
    prevLast: first.last_touch_utm,
    firstIncoming: {
      utm_source: "google",
      utm_campaign: "retarget",
    },
    lastIncoming: {
      utm_source: "google",
      utm_campaign: "retarget",
    },
  });
  assert.equal(second.first_touch_utm.utm_campaign, "spring");
  assert.equal(second.last_touch_utm.utm_campaign, "retarget");
  assert.equal(second.first_touch_utm.utm_source, "facebook");
});

test("rate-limit bot spam'i engeller", () => {
  const bucket: RateBucket = { timestamps: [] };
  const now = Date.now();
  assert.equal(
    rateLimitAllow(bucket, now, LIMITS.rateWindowMs, LIMITS.rateMaxEvents, 50),
    true
  );
  assert.equal(
    rateLimitAllow(bucket, now, LIMITS.rateWindowMs, LIMITS.rateMaxEvents, 20),
    false
  );
});

test("unknown event normalize'da rejected", () => {
  const { accepted, rejected } = normalizeCollectEvents(
    [
      {
        event_name: "FakePurchase",
        client_event_id: "x1",
      },
      {
        event_name: "AddToCart",
        client_event_id: "x2",
        metadata: { packageId: 1 },
      },
    ],
    new Set()
  );
  assert.equal(accepted.length, 1);
  assert.equal(accepted[0].event_name, "AddToCart");
  assert.ok(rejected.some((r) => r.reason === "unknown_event"));
});

test("client lead_id body alanı normalize sonucunda yok sayılır", () => {
  const { accepted } = normalizeCollectEvents(
    [
      {
        event_name: "Schedule",
        client_event_id: "sched-1",
        lead_id: "client-forged-lead",
        metadata: { total: 1000 },
      },
    ],
    new Set()
  );
  assert.equal(accepted.length, 1);
  assert.ok(!("lead_id" in accepted[0]));
});
