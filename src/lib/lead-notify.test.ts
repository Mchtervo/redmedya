import assert from "node:assert/strict";
import test from "node:test";
import { buildLeadNotifyText } from "@/lib/lead-notify";
import type { LeadRecord } from "@/types/site-settings";

function sampleLead(): LeadRecord {
  return {
    id: "lead-1",
    createdAt: "2026-08-17T12:00:00.000Z",
    source: "whatsapp",
    customer: {
      firstName: "Ayşe",
      lastName: "Yılmaz",
      phone: "05551234567",
      weddingDate: "2026-09-12",
      note: "",
    },
    cart: {
      selectedIds: ["paket-2"],
      lineSummary: ["Paket 2 — Sinematik + Albüm"],
      subtotal: 15000,
      total: 15000,
      count: 1,
    },
  };
}

test("lead bildirim metni paket / plato / toplam içerir", () => {
  const text = buildLeadNotifyText(sampleLead());
  assert.match(text, /Paket 2/);
  assert.match(text, /Sonra karar vereceğim/);
  assert.match(text, /15.000|15000/);
  assert.match(text, /Ayşe Yılmaz/);
  assert.match(text, /05551234567/);
});
