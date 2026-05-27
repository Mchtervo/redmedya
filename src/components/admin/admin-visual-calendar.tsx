"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

type AdminVisualCalendarProps = {
  reservations: ReservationRecord[];
  selectedId?: string | null;
  onSelect?: (r: ReservationRecord) => void;
  /** Boş veya dolu güne tıklanınca (ISO tarih YYYY-MM-DD) */
  onDayClick?: (iso: string, events: ReservationRecord[]) => void;
  /** Tıklanan / seçilen düğün tarihine göre ay görünümünü sabitle (YYYY-MM-DD) */
  anchorIso?: string | null;
  compact?: boolean;
};

export function AdminVisualCalendar({
  reservations,
  selectedId,
  onSelect,
  onDayClick,
  anchorIso,
  compact = false,
}: AdminVisualCalendarProps) {
  const [view, setView] = useState(() => {
    const n = new Date();
    return { year: n.getFullYear(), month: n.getMonth() };
  });

  useEffect(() => {
    if (!anchorIso || anchorIso.length < 7) return;
    const [y, m] = anchorIso.slice(0, 10).split("-").map(Number);
    if (!y || !m || m < 1 || m > 12) return;
    setView({ year: y, month: m - 1 });
  }, [anchorIso]);

  const byDate = useMemo(() => {
    const map = new Map<string, ReservationRecord[]>();
    for (const r of reservations) {
      const d = r.customer.weddingDate?.slice(0, 10);
      if (!d) continue;
      const list = map.get(d) ?? [];
      list.push(r);
      map.set(d, list);
    }
    return map;
  }, [reservations]);

  const { year, month } = view;
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let startPad = firstDay.getDay() - 1;
  if (startPad < 0) startPad = 6;

  const cells: (number | null)[] = [];
  for (let i = 0; i < startPad; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const monthLabel = firstDay.toLocaleDateString("tr-TR", {
    month: "long",
    year: "numeric",
  });

  const prev = () =>
    setView((v) =>
      v.month === 0
        ? { year: v.year - 1, month: 11 }
        : { year: v.year, month: v.month - 1 }
    );
  const next = () =>
    setView((v) =>
      v.month === 11
        ? { year: v.year + 1, month: 0 }
        : { year: v.year, month: v.month + 1 }
    );

  const handleDay = (iso: string, events: ReservationRecord[]) => {
    if (onDayClick) {
      onDayClick(iso, events);
      return;
    }
    if (events.length > 0) onSelect?.(events[0]);
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-4 backdrop-blur-sm",
        compact && "p-3"
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-display text-lg capitalize text-rm-off-white">
          {monthLabel}
        </h3>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={prev}
            className="rounded-lg border border-white/10 p-2 text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
            aria-label="Önceki ay"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="rounded-lg border border-white/10 p-2 text-rm-gray-400 hover:bg-white/5 hover:text-rm-off-white"
            aria-label="Sonraki ay"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-semibold tracking-wider text-rm-gray-500 uppercase">
        {WEEKDAYS.map((w) => (
          <div key={w} className="py-1">
            {w}
          </div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (day == null) {
            return <div key={`e-${i}`} className="aspect-square" />;
          }
          const iso = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const events = byDate.get(iso) ?? [];
          const hasEvent = events.length > 0;
          const isSelected = events.some((e) => e.id === selectedId);

          return (
            <button
              key={iso}
              type="button"
              onClick={() => handleDay(iso, events)}
              className={cn(
                "relative flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg text-sm transition-all",
                hasEvent
                  ? "bg-rm-champagne/15 font-medium text-rm-champagne hover:bg-rm-champagne/25"
                  : "text-rm-gray-400 hover:border hover:border-dashed hover:border-rm-champagne/40 hover:bg-white/[0.03] hover:text-rm-off-white",
                isSelected && "ring-2 ring-rm-champagne ring-offset-1 ring-offset-rm-black"
              )}
            >
              {day}
              {hasEvent && (
                <span className="absolute bottom-1 flex gap-0.5">
                  {events.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="h-1 w-1 rounded-full bg-rm-champagne"
                    />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-center text-[10px] text-rm-gray-600">
        Boş gün → yeni rezervasyon · Dolu gün → seç / düzenle
      </p>
    </div>
  );
}
