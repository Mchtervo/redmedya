"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatWeddingDateDisplay } from "@/lib/date-format";

const MONTHS_TR = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
] as const;

const WEEKDAYS_TR = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"] as const;
const POPOVER_HEIGHT = 360;

function parseIso(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) };
}

function toIso(y: number, month: number, day: number): string {
  return `${y}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function startWeekdayMonday(year: number, month: number): number {
  const day = new Date(year, month, 1).getDay();
  return day === 0 ? 6 : day - 1;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function isPast(year: number, month: number, day: number): boolean {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  const cell = new Date(year, month, day);
  cell.setHours(0, 0, 0, 0);
  return cell < t;
}

type PopoverPos = {
  top: number;
  left: number;
  width: number;
  placement: "below" | "above";
};

type WeddingDatePickerProps = {
  value: string;
  onChange: (iso: string) => void;
  className?: string;
  placeholder?: string;
  blockedDates?: string[];
};

export function WeddingDatePicker({
  value,
  onChange,
  className,
  placeholder = "Düğün tarihi seçin",
  blockedDates = [],
}: WeddingDatePickerProps) {
  const blockedSet = useMemo(() => new Set(blockedDates), [blockedDates]);
  const today = useMemo(() => new Date(), []);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [pos, setPos] = useState<PopoverPos | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selected = parseIso(value);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (selected) {
      setViewYear(selected.y);
      setViewMonth(selected.m);
    }
  }, [value]);

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const width = Math.max(rect.width, 300);
    let left = rect.left;
    if (left + width > window.innerWidth - 12) {
      left = window.innerWidth - width - 12;
    }
    left = Math.max(12, left);

    const spaceBelow = window.innerHeight - rect.bottom;
    const placement =
      spaceBelow < POPOVER_HEIGHT && rect.top > POPOVER_HEIGHT ? "above" : "below";

    const top =
      placement === "below" ? rect.bottom + 8 : rect.top - POPOVER_HEIGHT - 8;

    setPos({ top, left, width, placement });
  }, []);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (triggerRef.current?.contains(t) || popoverRef.current?.contains(t)) return;
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const grid = useMemo(() => {
    const total = daysInMonth(viewYear, viewMonth);
    const start = startWeekdayMonday(viewYear, viewMonth);
    const cells: ({ day: number } | null)[] = [];
    for (let i = 0; i < start; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push({ day: d });
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [viewYear, viewMonth]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const pickDay = (day: number) => {
    if (isPast(viewYear, viewMonth, day)) return;
    onChange(toIso(viewYear, viewMonth, day));
    setOpen(false);
  };

  const pickToday = () => {
    const y = today.getFullYear();
    const m = today.getMonth();
    const d = today.getDate();
    onChange(toIso(y, m, d));
    setViewYear(y);
    setViewMonth(m);
    setOpen(false);
  };

  const display = value ? formatWeddingDateDisplay(value) : placeholder;

  const popover =
    open && mounted && pos
      ? createPortal(
          <>
            <div
              className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px] md:bg-transparent md:backdrop-blur-0"
              aria-hidden
              onClick={() => setOpen(false)}
            />
            <div
              ref={popoverRef}
              role="dialog"
              aria-label="Tarih seçici"
              style={{
                position: "fixed",
                top: pos.top,
                left: pos.left,
                width: pos.width,
                zIndex: 201,
              }}
              className={cn(
                "overflow-hidden rounded-md border border-white/12",
                "bg-[#1a1a1a] shadow-[0_20px_60px_rgba(0,0,0,0.75),0_0_0_1px_rgba(255,255,255,0.05)_inset]"
              )}
            >
              <div className="flex items-center justify-between gap-2 border-b border-white/[0.08] bg-white/[0.03] px-4 py-3.5">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-rm-gray-300 transition-colors hover:border-rm-champagne/30 hover:text-rm-off-white"
                  aria-label="Önceki ay"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <p className="text-center text-sm font-medium tracking-wide text-rm-off-white">
                  {MONTHS_TR[viewMonth]}{" "}
                  <span className="text-rm-champagne">{viewYear}</span>
                </p>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 text-rm-gray-300 transition-colors hover:border-rm-champagne/30 hover:text-rm-off-white"
                  aria-label="Sonraki ay"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 px-3 py-4">
                {WEEKDAYS_TR.map((wd) => (
                  <span
                    key={wd}
                    className="pb-1 text-center text-[11px] font-semibold text-rm-gray-500"
                  >
                    {wd}
                  </span>
                ))}
                {grid.map((cell, i) => {
                  if (!cell) {
                    return <span key={`e-${i}`} className="h-10" />;
                  }
                  const { day } = cell;
                  const past = isPast(viewYear, viewMonth, day);
                  const iso = toIso(viewYear, viewMonth, day);
                  const blocked = blockedSet.has(iso);
                  const disabled = past || blocked;
                  const isSelected =
                    selected?.y === viewYear &&
                    selected?.m === viewMonth &&
                    selected?.d === day;
                  const isToday =
                    today.getFullYear() === viewYear &&
                    today.getMonth() === viewMonth &&
                    today.getDate() === day;

                  return (
                    <button
                      key={`${viewMonth}-${day}`}
                      type="button"
                      disabled={disabled}
                      onClick={() => pickDay(day)}
                      title={blocked ? "Bu tarih dolu" : undefined}
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md text-sm tabular-nums transition-colors",
                        disabled && "cursor-not-allowed text-rm-gray-600",
                        blocked && !past && "line-through opacity-50",
                        !disabled &&
                          !isSelected &&
                          "text-rm-gray-200 hover:bg-white/[0.08]",
                        isToday &&
                          !isSelected &&
                          "font-medium text-rm-champagne ring-1 ring-rm-champagne/35",
                        isSelected &&
                          "bg-rm-champagne font-semibold text-rm-black shadow-sm"
                      )}
                    >
                      {day}
                    </button>
                  );
                })}
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.08] bg-white/[0.02] px-4 py-3">
                <button
                  type="button"
                  onClick={() => {
                    onChange("");
                    setOpen(false);
                  }}
                  className="rounded-md px-2 py-1 text-xs text-rm-gray-400 transition-colors hover:bg-white/5 hover:text-rm-off-white"
                >
                  Temizle
                </button>
                <button
                  type="button"
                  onClick={pickToday}
                  className="rounded-md bg-rm-champagne/15 px-3 py-1.5 text-xs font-medium text-rm-champagne transition-colors hover:bg-rm-champagne/25"
                >
                  Bugün
                </button>
              </div>
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className={cn("relative", className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => {
          setOpen((o) => !o);
          if (!open) requestAnimationFrame(updatePosition);
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          "flex h-12 w-full items-center justify-between gap-3 rounded-sm border px-4 text-left text-sm transition-colors",
          "border-white/10 bg-white/[0.04] hover:border-rm-champagne/30",
          open && "border-rm-champagne/40 ring-1 ring-rm-champagne/25",
          value ? "text-rm-off-white" : "text-rm-gray-400"
        )}
      >
        <span className="truncate">{display}</span>
        <Calendar className="h-4 w-4 shrink-0 text-rm-champagne" strokeWidth={1.25} />
      </button>
      {popover}
    </div>
  );
}
