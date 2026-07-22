import {
  ADDONS,
  PACKAGES,
  PRICING,
  getAddon,
  getPackage,
  getPlato,
  resolveAddonPricing,
  type AddonId,
  type PackageId,
} from "@/config/pricing";
import type { PackageBuilderState } from "@/lib/paket/state";

export type LineItemKind =
  | "package"
  | "plato"
  | "venue-discount"
  | "removal"
  | "addon"
  | "gift";

export type LineItem = {
  key: string;
  label: string;
  /** toplam fiyata katkı (indirim/çıkarma negatif) */
  amount: number;
  kind: LineItemKind;
  /** kampanya/hediye satırlarında üstü çizili list fiyatı */
  originalAmount?: number;
  /** hediye satırı (₺0 ama değer taşır) */
  isGift?: boolean;
  /** fiyat yerine gösterilecek etiket (ör. "ÜCRETSİZ", "HEDİYE") */
  rightLabel?: string;
  note?: string;
};

export type TotalResult = {
  total: number;
  savings: number;
  /** üstü çizili değer toplamı (çapa) */
  valueTotal: number;
  lineItems: LineItem[];
};

/** Bu addon mevcut pakette zaten dahil mi (kilitli) */
function isIncluded(addonId: AddonId, packageId: PackageId): boolean {
  const def = ADDONS.find((a) => a.id === addonId);
  return Boolean(def?.includedInPackages?.includes(packageId));
}

/**
 * Sepet + kazanç hesabının TEK kaynağı.
 * Gizli plato bedeli fiyata gömülüdür; hiçbir line item olarak dışa vurulmaz.
 */
export function calculateTotal(state: PackageBuilderState): TotalResult {
  if (state.packageId == null) {
    return { total: 0, savings: 0, valueTotal: 0, lineItems: [] };
  }

  const pkg = getPackage(state.packageId);
  const ownVenue = state.plato === "own";
  const lineItems: LineItem[] = [];

  // 1) Paket taban fiyatı
  lineItems.push({
    key: `package-${pkg.id}`,
    label: `${pkg.name} — ${pkg.subtitle}`,
    amount: pkg.price,
    kind: "package",
  });

  let total = pkg.price;

  // 2a) Plato — özet kartında görünsün (TUTAR gösterilmez, sadece "ÜCRETSİZ")
  if (state.plato && !ownVenue) {
    lineItems.push({
      key: "plato",
      label: `🏛 ${getPlato(state.plato).name}`,
      amount: 0,
      kind: "plato",
      rightLabel: "ÜCRETSİZ",
    });
  }

  // 2b) Kendi mekânı → −₺2.000 (plato hediyesi yerine mekân indirimi)
  if (ownVenue) {
    lineItems.push({
      key: "venue-discount",
      label: "🏛 Kendi mekânınız",
      amount: -PRICING.OWN_VENUE_DISCOUNT,
      kind: "venue-discount",
    });
    total -= PRICING.OWN_VENUE_DISCOUNT;
  }

  // 2c) P3 hediye drone — özet kartında hediye olarak görünsün
  if (pkg.id === 3) {
    lineItems.push({
      key: "drone-gift",
      label: "🚁 Dış çekim drone",
      amount: 0,
      kind: "gift",
      isGift: true,
      rightLabel: `HEDİYE · ₺${PRICING.DRONE_GIFT_VALUE.toLocaleString(
        "tr-TR"
      )} değerinde`,
    });
  }

  // 3) Paketten çıkarılan dahil kalemler (à la carte değeri kadar düş)
  for (const rem of pkg.removables) {
    if (!state.removals.includes(rem.id)) continue;
    const value = rem.value * (rem.count ?? 1);
    const label = rem.count && rem.count > 1 ? `${rem.label} (${rem.count} adet)` : rem.label;
    lineItems.push({
      key: `removal-${rem.id}`,
      label: `${label} çıkarıldı`,
      amount: -value,
      kind: "removal",
    });
    total -= value;
  }

  // 4) Ek hizmetler
  let campaignKlipSavings = 0;
  for (const sel of state.addons) {
    // Pakette dahil olan addon'lar fiyatlandırılmaz (kilitli/dahil)
    if (isIncluded(sel.id, pkg.id)) continue;
    const def = getAddon(sel.id);
    const pricing = resolveAddonPricing(def, pkg.id); // P3 salon-full yükseltme farkı
    const qty = def.quantity ? Math.max(1, sel.quantity) : 1;
    const amount = pricing.price * qty;
    const isCampaign =
      pricing.originalPrice != null && pricing.originalPrice > pricing.price;
    const baseLabel = pricing.isUpgrade ? `${def.name} (yükseltme)` : def.name;

    lineItems.push({
      key: `addon-${sel.id}`,
      label: qty > 1 ? `${baseLabel} (${qty} adet)` : baseLabel,
      amount,
      kind: "addon",
      originalAmount: isCampaign ? pricing.originalPrice! * qty : undefined,
    });
    total += amount;

    if (isCampaign) {
      campaignKlipSavings += (pricing.originalPrice! - pricing.price) * qty;
    }
  }

  // 5) Kazanç (savings)
  //    Anlaşmalı plato: paket editorial kazancı (kademeli: P1<P2<P3, drone dahil).
  //    Kendi mekânı: plato hediyesi düşer, mekân indirimi eklenir.
  const packageSavings = ownVenue
    ? pkg.savings - PRICING.PLATO_HIDDEN_FEE + PRICING.OWN_VENUE_DISCOUNT
    : pkg.savings;
  const savings = Math.max(0, packageSavings + campaignKlipSavings);

  // Üstü çizili değer toplamı = paket fiyatı (mekâna göre) + paket kazancı.
  // Böylece strike ile satış fiyatı asla eşit görünmez.
  const basePrice = ownVenue ? pkg.price - PRICING.OWN_VENUE_DISCOUNT : pkg.price;
  const valueTotal = basePrice + packageSavings;

  return {
    total: Math.max(0, total),
    savings,
    valueTotal,
    lineItems,
  };
}

/** Kart için üstü çizili değer toplamı (= fiyat + kazanç, mekâna göre) */
export function previewPackageValue(
  packageId: PackageId,
  ownVenue: boolean
): number {
  return (
    previewPackagePrice(packageId, ownVenue) +
    previewPackageSavings(packageId, ownVenue)
  );
}

/** Paket seçili değilken bir paketin canlı fiyatını (plato'ya göre) önizleme */
export function previewPackagePrice(
  packageId: PackageId,
  ownVenue: boolean
): number {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return 0;
  return ownVenue ? pkg.price - PRICING.OWN_VENUE_DISCOUNT : pkg.price;
}

export function previewPackageSavings(
  packageId: PackageId,
  ownVenue: boolean
): number {
  const pkg = PACKAGES.find((p) => p.id === packageId);
  if (!pkg) return 0;
  return ownVenue
    ? pkg.savings - PRICING.PLATO_HIDDEN_FEE + PRICING.OWN_VENUE_DISCOUNT
    : pkg.savings;
}
