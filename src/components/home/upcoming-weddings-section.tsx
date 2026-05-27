"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SectionReveal } from "@/components/effects/section-reveal";
import { formatPrice } from "@/lib/utils";
import {
  formatMonthKey,
  groupByMonth,
  sortPublicWeddings,
} from "@/lib/reservation-public";
import type { PublicWeddingPreview } from "@/types/reservations";
import { formatWeddingDateDisplay } from "@/lib/date-format";

export function UpcomingWeddingsSection() {
  const [items, setItems] = useState<PublicWeddingPreview[]>([]);

  useEffect(() => {
    fetch("/api/public/reservations")
      .then((r) => r.json())
      .then((d) => setItems(sortPublicWeddings(Array.isArray(d) ? d : [])))
      .catch(() => setItems([]));
  }, []);

  const grouped = useMemo(() => groupByMonth(items), [items]);

  if (items.length === 0) return null;

  return (
    <section
      id="yaklasan-dugunler"
      className="section-padding border-t border-white/8 bg-rm-black scroll-mt-24"
    >
      <div className="section-container">
        <SectionReveal>
          <p className="text-center text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
            Takvim
          </p>
          <h2 className="mt-4 text-center font-editorial text-[clamp(2rem,5vw,3rem)] text-rm-off-white">
            Yaklaşan düğünler
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-rm-gray-400">
            Onaylanmış rezervasyonlar — en yakın tarihler önce. Kalan ödeme
            tutarı gösterilir.
          </p>
        </SectionReveal>

        <div className="mt-12 space-y-10">
          {[...grouped.entries()].map(([monthKey, monthItems], gi) => (
            <SectionReveal key={monthKey} delay={gi * 0.06}>
              <h3 className="mb-4 font-display text-xl text-rm-champagne">
                {formatMonthKey(monthKey)}
              </h3>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {monthItems.map((w) => (
                  <li key={w.id}>
                    <Link
                      href={`/rezervasyon/${w.id}`}
                      className="block rounded-sm border border-white/10 bg-rm-black-elevated p-5 transition-colors hover:border-rm-champagne/30"
                    >
                      <p className="font-display text-lg text-rm-off-white">
                        {w.couple}
                      </p>
                      <p className="mt-1 text-sm text-rm-gray-400">
                        {formatWeddingDateDisplay(w.weddingDate)}
                      </p>
                      <p className="mt-3 text-sm text-rm-gray-500">
                        {w.serviceCount} hizmet · Toplam{" "}
                        {formatPrice(w.total)}
                      </p>
                      {w.remainingAmount > 0 && (
                        <p className="mt-2 font-medium text-rm-champagne">
                          Kalan: {formatPrice(w.remainingAmount)}
                        </p>
                      )}
                      <span className="mt-3 inline-block text-xs tracking-wide text-rm-gray-500 uppercase">
                        Detay →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </SectionReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
