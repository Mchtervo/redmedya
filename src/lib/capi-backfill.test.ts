import assert from "node:assert/strict";
import test from "node:test";
import {
  alreadySent,
  backfillEventId,
  BACKFILL_WINDOW_MS,
  eventTimeUnix,
  isWithinBackfillWindow,
  markSent,
  type BackfillSentFile,
} from "@/lib/capi-backfill";

test("7 günden eski lead backfill penceresine girmez", () => {
  const now = Date.parse("2026-08-13T20:00:00.000Z");
  const old = new Date(now - BACKFILL_WINDOW_MS - 1000).toISOString();
  const recent = new Date(now - 2 * 864e5).toISOString();
  assert.equal(isWithinBackfillWindow(old, now), false);
  assert.equal(isWithinBackfillWindow(recent, now), true);
});

test("aynı lead + event için event_id benzersiz ve stabil", () => {
  const a = backfillEventId("lead-123", "Lead");
  const b = backfillEventId("lead-123", "Contact");
  const c = backfillEventId("lead-123", "WhatsAppClick");
  assert.equal(a, "backfill_lead_lead-123");
  assert.notEqual(a, b);
  assert.notEqual(b, c);
  assert.equal(backfillEventId("lead-123", "Lead"), a);
});

test("gönderilen event tekrar işaretlenir, mükerrer sayılır", () => {
  const file: BackfillSentFile = { sent: {} };
  assert.equal(alreadySent(file, "lead-1", "Lead"), false);
  markSent(file, "lead-1", "Lead", "backfill_lead_lead-1", "2026-08-13T00:00:00.000Z");
  assert.equal(alreadySent(file, "lead-1", "Lead"), true);
  assert.equal(alreadySent(file, "lead-1", "Contact"), false);
});

test("event_time orijinal createdAt unix saniyesi", () => {
  const iso = "2026-08-10T12:00:00.000Z";
  assert.equal(eventTimeUnix(iso), Math.floor(Date.parse(iso) / 1000));
});
