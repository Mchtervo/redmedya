"use client";

import { useMemo } from "react";
import { AlertTriangle, CalendarClock, Flame } from "lucide-react";
import { usePackageStore } from "@/stores/package-store";
import { useSiteSettings } from "@/hooks/use-site-settings";
import {
  getCapacityBanner,
  getWeddingDateWarning,
} from "@/lib/date-capacity";
import { cn } from "@/lib/utils";

export function DateCapacityAlerts({ className }: { className?: string }) {
  const customer = usePackageStore((s) => s.customer);
  const { settings } = useSiteSettings();

  const alerts = useMemo(() => {
    const list = [];
    const cap = getCapacityBanner(settings.capacity);
    if (cap) list.push(cap);
    const dateW = getWeddingDateWarning(
      customer.weddingDate,
      settings.blockedDates,
      settings.seasonalRules
    );
    if (dateW) list.push(dateW);
    return list;
  }, [customer.weddingDate, settings]);

  if (alerts.length === 0) return null;

  const icon = (variant: string) => {
    if (variant === "urgency") return Flame;
    if (variant === "blocked") return AlertTriangle;
    return CalendarClock;
  };

  return (
    <div className={cn("space-y-2", className)}>
      {alerts.map((a, i) => {
        const Icon = icon(a.variant);
        return (
          <div
            key={`${a.variant}-${i}`}
            className={cn(
              "flex gap-2.5 rounded-md border px-3 py-2.5",
              a.variant === "urgency" && "border-rm-champagne/35 bg-rm-champagne/10",
              a.variant === "busy" && "border-amber-500/30 bg-amber-500/10",
              a.variant === "blocked" && "border-red-500/30 bg-red-500/10",
              a.variant === "seasonal" && "border-white/15 bg-white/[0.03]"
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 h-4 w-4 shrink-0",
                a.variant === "urgency" && "text-rm-champagne",
                a.variant === "busy" && "text-amber-400",
                a.variant === "blocked" && "text-red-400",
                a.variant === "seasonal" && "text-rm-gray-400"
              )}
              strokeWidth={1.5}
            />
            <div>
              <p className="text-xs font-semibold text-rm-off-white">{a.title}</p>
              <p className="mt-0.5 text-[11px] leading-relaxed text-rm-gray-400">
                {a.message}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
