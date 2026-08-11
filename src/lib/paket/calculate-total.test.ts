/**
 * calculateTotal birim testleri.
 *
 * Fiyat modeli (REV.7):
 *   P1 ₺16.750→11.000 (indirim 2.750 + hediye 3.000 = kazanç 5.750)
 *   P2 ₺21.750→15.000 (indirim 3.750 + hediye 3.000 = kazanç 6.750)
 *   P3 ₺34.500→22.000 (5.500 + drone 4.000 + hediye 3.000 = kazanç 12.500)
 */
import assert from "node:assert/strict";
import test from "node:test";
import { initialState, type PackageBuilderState } from "@/lib/paket/state";
import { calculateTotal } from "@/lib/paket/calculate-total";

function make(partial: Partial<PackageBuilderState>): PackageBuilderState {
  return { ...initialState, ...partial };
}

test("Paket 1 — kazanç 5.750 (indirim + hediye)", () => {
  const r = calculateTotal(make({ packageId: 1, plato: "no25" }));
  assert.equal(r.total, 11000);
  assert.equal(r.savings, 5750);
  assert.equal(r.valueTotal, 16750);
});

test("Paket 2 — kazanç 6.750 (indirim + hediye)", () => {
  const r = calculateTotal(make({ packageId: 2, plato: "anka" }));
  assert.equal(r.total, 15000);
  assert.equal(r.savings, 6750);
  assert.equal(r.valueTotal, 21750);
});

test("Paket 3 — kazanç 12.500 (indirim + drone + hediye)", () => {
  const r = calculateTotal(make({ packageId: 3, plato: "baska" }));
  assert.equal(r.total, 22000);
  assert.equal(r.savings, 12500);
  assert.equal(r.valueTotal, 34500);
});

test("Kendi mekânı → −₺2.000 fiyat; hediye düşer + mekân indirimi", () => {
  const p1 = calculateTotal(make({ packageId: 1, plato: "own" }));
  assert.equal(p1.total, 9000);
  assert.equal(p1.savings, 4750); // 5.750 − 3.000 + 2.000
  const p2 = calculateTotal(make({ packageId: 2, plato: "own" }));
  assert.equal(p2.total, 13000);
  assert.equal(p2.savings, 5750);
  const p3 = calculateTotal(make({ packageId: 3, plato: "own" }));
  assert.equal(p3.total, 20000);
  assert.equal(p3.savings, 11500);
});

test("Kampanyalı klip eklenince +₺3.500 fiyat, +₺1.500 kazanç", () => {
  const r = calculateTotal(
    make({ packageId: 1, plato: "no25", addons: [{ id: "klip-gelin-alma", quantity: 1 }] })
  );
  assert.equal(r.total, 14500);
  assert.equal(r.savings, 7250); // 5.750 + 1.500
});

test("Büyük albüm ekleme kampanya farkını kazanca yansıtır (4.500→2.500)", () => {
  const r = calculateTotal(
    make({ packageId: 1, plato: "no25", addons: [{ id: "buyuk-album", quantity: 1 }] })
  );
  assert.equal(r.total, 13500); // 11.000 + 2.500
  assert.equal(r.savings, 7750); // 5.750 + (4.500 − 2.500)
});

test("Salon Full HER pakette ₺6.000 (üstü çizili 8.500 → +2.500 kazanç) — P3", () => {
  const r = calculateTotal(
    make({ packageId: 3, plato: "no25", addons: [{ id: "salon-full", quantity: 1 }] })
  );
  assert.equal(r.total, 28000); // 22.000 + 6.000
  assert.equal(r.savings, 15000); // 12.500 + (8.500 − 6.000)
});

test("Salon Full P1'de de ₺6.000 / +₺2.500 kazanç", () => {
  const r = calculateTotal(
    make({ packageId: 1, plato: "no25", addons: [{ id: "salon-full", quantity: 1 }] })
  );
  assert.equal(r.total, 17000); // 11.000 + 6.000
  assert.equal(r.savings, 8250); // 5.750 + 2.500
});

test("Drone addon fiyatı ₺4.000", () => {
  const r = calculateTotal(
    make({ packageId: 1, plato: "no25", addons: [{ id: "drone", quantity: 1 }] })
  );
  assert.equal(r.total, 15000); // 11.000 + 4.000
});

test("P2'den 2 aile albümü çıkarılınca −₺2.000", () => {
  const r = calculateTotal(
    make({ packageId: 2, plato: "anka", removals: ["p-aile-album"] })
  );
  assert.equal(r.total, 13000);
});
