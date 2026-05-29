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
    <section className="rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between border-b border-white/8 pb-4">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-rm-champagne/25 bg-rm-champagne/10 text-rm-champagne">
            <Banknote className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <div>
            <h3 className="font-editorial text-xl text-rm-off-white">
              Finans özeti
            </h3>
            <p className="mt-0.5 text-xs text-rm-gray-500">
              Onaylı rezervasyonlardan otomatik hesaplanır
            </p>
          </div>
        </div>
        <span className="hidden rounded-full bg-white/[0.04] px-3 py-1 text-[10px] tracking-[0.2em] text-rm-gray-500 uppercase sm:block">
          Tahmini
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className={`relative overflow-hidden rounded-xl border p-4 backdrop-blur-sm ${c.tint}`}
            >
              <div className="flex items-start justify-between">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/12 bg-white/[0.06] text-rm-champagne">
                  <Icon className="h-4 w-4" strokeWidth={1.6} />
                </span>
              </div>
              <p className={`mt-3 font-editorial text-2xl leading-tight tabular-nums ${c.accent}`}>
                {c.value}
              </p>
              <p className="mt-2 text-[10px] font-semibold tracking-[0.22em] text-rm-gray-400 uppercase">
                {c.label}
              </p>
              <p className="mt-0.5 text-[11px] text-rm-gray-500">{c.hint}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
