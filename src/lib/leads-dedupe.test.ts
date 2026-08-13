import assert from "node:assert/strict";
import test from "node:test";
import { findDuplicateLead } from "@/lib/leads-dedupe";
import { LEAD_WAIT_MS } from "@/lib/paket/durable-post";
import type { LeadRecord } from "@/types/site-settings";

function lead(partial: Partial<LeadRecord> & Pick<LeadRecord, "id" | "createdAt">): LeadRecord {
  return {
    source: "whatsapp",
    customer: {
      firstName: "A",
      lastName: "B",
      phone: "05551234567",
      weddingDate: "2026-09-01",
      note: "",
    },
    cart: { selectedIds: [], lineSummary: [], subtotal: 0, total: 0, count: 0 },
    ...partial,
  };
}

test("lead POST bekleme 500ms", () => {
  assert.equal(LEAD_WAIT_MS, 500);
});

test("aynı client_request_id mükerrer lead sayılır", () => {
  const existing = lead({
    id: "lead-1",
    createdAt: new Date().toISOString(),
    client_request_id: "abc-1",
  });
  const found = findDuplicateLead([existing], { clientRequestId: "abc-1" });
  assert.equal(found?.id, "lead-1");
});

test("aynı session + telefon 10 dk içinde dedupe", () => {
  const existing = lead({
    id: "lead-2",
    createdAt: new Date().toISOString(),
    sessionId: "sid-9",
  });
  const found = findDuplicateLead([existing], {
    sessionId: "sid-9",
    phone: "0555 123 45 67",
  });
  assert.equal(found?.id, "lead-2");
});

test("eski kayıt dedupe olmaz", () => {
  const existing = lead({
    id: "lead-old",
    createdAt: new Date(Date.now() - 11 * 60 * 1000).toISOString(),
    sessionId: "sid-9",
  });
  const found = findDuplicateLead([existing], {
    sessionId: "sid-9",
    phone: "05551234567",
  });
  assert.equal(found, undefined);
});
