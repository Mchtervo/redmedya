import type { SeasonalRule, CapacityConfig } from "@/types/site-settings";

export type DateWarning = {
  variant: "urgency" | "busy" | "blocked" | "seasonal";
  title: string;
  message: string;
};

function parseYmd(dateStr: string): { y: number; m: number; d: number } | null {
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3] };
}

function monthInRange(month: number, start: number, end: number): boolean {
  if (start <= end) return month >= start && month <= end;
  return month >= start || month <= end;
}

export function getSeasonalRuleForDate(
  weddingDate: string,
  rules: SeasonalRule[]
): SeasonalRule | null {
  const parsed = parseYmd(weddingDate);
  if (!parsed) return null;
  return (
    rules.find(
      (r) =>
        r.isActive !== false &&
        monthInRange(parsed.m, r.startMonth, r.endMonth)
    ) ?? null
  );
}

export function getSeasonalSurchargePercent(
  weddingDate: string,
  rules: SeasonalRule[]
): number {
  return getSeasonalRuleForDate(weddingDate, rules)?.pricePercent ?? 0;
}

export function getCapacityBanner(capacity: CapacityConfig): DateWarning | null {
  if (!capacity.enabled || capacity.datesLeftThisMonth <= 0) return null;
  const label = capacity.monthLabel ?? "bu ay";
  return {
    variant: "urgency",
    title: `Sadece ${capacity.datesLeftThisMonth} tarih kaldı`,
    message: `${label.charAt(0).toUpperCase() + label.slice(1)} kontenjanımız dolmak üzere — düğün tarihinizi şimdi paylaşırsanız öncelikli teklif hazırlarız.`,
  };
}

export function getWeddingDateWarning(
  weddingDate: string,
  blockedDates: string[],
  seasonalRules: SeasonalRule[]
): DateWarning | null {
  if (!weddingDate) return null;

  if (blockedDates.includes(weddingDate)) {
    return {
      variant: "blocked",
      title: "Bu tarih müsait değil",
      message:
        "Seçtiğiniz gün dolu görünüyor. WhatsApp’tan alternatif tarih sorabilir veya yakın bir gün seçebilirsiniz.",
    };
  }

  const parsed = parseYmd(weddingDate);
  if (!parsed) return null;

  const today = new Date();
  const wedding = new Date(parsed.y, parsed.m - 1, parsed.d);
  const daysUntil = Math.ceil(
    (wedding.getTime() - today.setHours(0, 0, 0, 0)) / 86400000
  );

  if (daysUntil > 0 && daysUntil <= 45) {
    return {
      variant: "busy",
      title: "Yoğun dönem — erken rezervasyon",
      message: `Düğününüze ${daysUntil} gün kaldı. Bu aralıkta ekip planlaması hızlı doluyor; teklifi bugün almanızı öneririz.`,
    };
  }

  return null;
}
