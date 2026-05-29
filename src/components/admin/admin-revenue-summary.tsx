"use client";

import { useMemo } from "react";
import { Banknote, Coins, Hourglass, Wallet } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import { formatPrice } from "@/lib/utils";

const MONTHS = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

/**
 * Onaylı rezervasyonlardan tahmini ciro ve tahsilat özeti.
 * - Bu ayın geliri (bu ay düğünü olan paketler)
 * - Toplam tahmini ciro
 * - Alınan kapora
 * - Kalan tahsilat
 */
export function AdminRevenueSummary({
  reservations,
}: {
  reservations: ReservationRecord[];
}) {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let monthRevenue = 0;
    let monthCount = 0;
    let total = 0;
    let depositTotal = 0;
    let remainingTotal = 0;

    for (const r of reservations) {
      total += r.total ?? 0;
      depositTotal += r.depositAmount ?? 0;
      remainingTotal += r.remainingAmount ?? 0;
      if (!r.customer.weddingDate) continue;
      const d = new Date(r.customer.weddingDate);
      if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
        monthRevenue += r.total ?? 0;
        monthCount += 1;
      }
    }

    return {
      monthRevenue,
      monthCount,
      total,
      depositTotal,
      remainingTotal,
      monthLabel: MONTHS[currentMonth],
    };
  }, [reservations]);

  const cards = [
    {
      label: `${stats.monthLabel} cirosu`,
      value: formatPrice(stats.monthRevenue),
      hint: `${stats.monthCount} düğün bu ay`,
      icon: Banknote,
      accent: "text-emerald-300",
      tint: "bg-emerald-500/[0.08] border-emerald-500/25",
    },
    {
      label: "Toplam tahmini ciro",
      value: formatPrice(stats.total),
      hint: `${reservations.length} onaylı paket`,
      icon: Coins,
      accent: "text-rm-champagne",
      tint: "bg-rm-champagne/[0.08] border-rm-champagne/30",
    },
    {
      label: "Alınan kapora",
      value: formatPrice(stats.depositTotal),
      hint: stats.total > 0
        ? `%${Math.round((stats.depositTotal / stats.total) * 100)} tahsil edildi`
        : "Henüz tahsilat yok",
      icon: Wallet,
      accent: "text-cyan-300",
      tint: "bg-cyan-500/[0.08] border-cyan-500/25",
    },
    {
      label: "Kalan tahsilat",
      value: formatPrice(stats.remainingTotal),
      hint: "Tüm onaylılarda kalan",
      icon: Hourglass,
      accent: "text-amber-300",
      tint: "bg-amber-500/[0.08] border-amber-500/25",
    },
  ];

  return (
    <section className="rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-4 backdrop-blur-sm sm:p-5 md:p-6">
      <div className="flex items-center justify-between border-b border-white/8 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-rm-champagne/25 bg-rm-champagne/10 text-rm-champagne">
            <Banknote className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <div>
            <h3 className="font-editorial text-lg text-rm-off-white sm:text-xl">
              Finans özeti
            </h3>
            <p className="mt-0.5 text-[11px] text-rm-gray-500 sm:text-xs">
              Onaylı rezervasyonlardan hesaplanır
            </p>
          </div>
        </div>
        <span className="hidden rounded-full bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.2em] text-rm-gray-500 uppercase sm:block">
          Tahmini
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:mt-5 sm:gap-3 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`relative overflow-hidden rounded-xl border p-3 backdrop-blur-sm sm:p-4 ${c.tint}`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-rm-champagne sm:h-9 sm:w-9">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.6} />
                </span>
              </div>
              <p className={`mt-2.5 font-editorial text-xl leading-tight tabular-nums sm:mt-3 sm:text-2xl ${c.accent}`}>
                {c.value}
              </p>
              <p className="mt-1.5 text-[9px] font-semibold tracking-[0.2em] text-rm-gray-400 uppercase sm:mt-2 sm:text-[10px] sm:tracking-[0.22em]">
                {c.label}
              </p>
              <p className="mt-0.5 truncate text-[10px] text-rm-gray-500 sm:text-[11px]">
                {c.hint}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
