"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Phone,
  MessageCircle,
  Calendar,
  ArrowRight,
} from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import { formatPrice } from "@/lib/utils";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { formatCustomerName } from "@/lib/customer-name";

const DAY_LABEL = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/**
 * Bu hafta düğünü olan çiftleri vurgular.
 * Pazartesi 00:00 — pazar 23:59 aralığı (Türkiye haftası).
 */
export function AdminThisWeekWeddings({
  reservations,
}: {
  reservations: ReservationRecord[];
}) {
  const router = useRouter();

  const items = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - ((day + 6) % 7));
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    return reservations
      .filter((r) => {
        if (!r.customer.weddingDate) return false;
        const t = new Date(r.customer.weddingDate).getTime();
        return t >= start.getTime() && t < end.getTime();
      })
      .sort(
        (a, b) =>
          new Date(a.customer.weddingDate).getTime() -
          new Date(b.customer.weddingDate).getTime()
      );
  }, [reservations]);

  if (items.length === 0) return null;

  return (
    <section className="relative overflow-hidden rounded-2xl border border-rm-champagne/30 bg-gradient-to-br from-rm-champagne/[0.12] via-rm-champagne/[0.04] to-transparent p-4 sm:p-5 md:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-rm-champagne/[0.18] blur-3xl"
      />
      <div className="relative flex flex-wrap items-end justify-between gap-3 border-b border-rm-champagne/20 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-rm-champagne/35 bg-rm-champagne/15 text-rm-champagne sm:h-9 sm:w-9">
            <Sparkles className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <div className="min-w-0">
            <p className="text-[9px] font-bold tracking-[0.28em] text-rm-champagne uppercase sm:text-[10px] sm:tracking-[0.3em]">
              Bu hafta
            </p>
            <h3 className="mt-0.5 font-editorial text-lg text-rm-off-white sm:text-xl">
              {items.length} düğün önünüzde
            </h3>
          </div>
        </div>
      </div>

      <ul className="relative mt-3 grid gap-2 sm:mt-4 sm:gap-2.5 md:grid-cols-2">
        {items.map((r) => {
          const date = new Date(r.customer.weddingDate);
          const tel = r.customer.phone
            ? `tel:+${formatPhoneForWhatsApp(r.customer.phone)}`
            : null;
          const wa = r.customer.phone
            ? `https://wa.me/${formatPhoneForWhatsApp(r.customer.phone)}`
            : null;
          return (
            <li
              key={r.id}
              className="group flex items-center gap-2.5 rounded-xl border border-rm-champagne/20 bg-rm-black/40 p-2.5 backdrop-blur-sm transition-all hover:border-rm-champagne/50 hover:bg-rm-black/60 sm:gap-3 sm:p-3 sm:hover:-translate-y-0.5"
            >
              <button
                type="button"
                onClick={() => router.push(`/admin?tab=calendar&res=${r.id}`)}
                className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl border border-rm-champagne/30 bg-rm-champagne/10 text-center text-rm-champagne transition-colors group-hover:bg-rm-champagne group-hover:text-rm-black sm:h-14 sm:w-14"
                title="Detayları gör"
              >
                <span className="font-editorial text-lg leading-none sm:text-xl">
                  {date.getDate()}
                </span>
                <span className="text-[8px] font-bold tracking-wider uppercase">
                  {DAY_LABEL[date.getDay()].slice(0, 3)}
                </span>
              </button>
              <button
                type="button"
                onClick={() => router.push(`/admin?tab=calendar&res=${r.id}`)}
                className="block min-w-0 flex-1 text-left"
              >
                <p className="truncate text-sm font-medium text-rm-off-white sm:text-base">
                  {formatCustomerName(r.customer)}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 truncate text-[11px] text-rm-gray-400 sm:text-xs">
                  <Calendar className="h-3 w-3 shrink-0 text-rm-gray-500" strokeWidth={1.6} />
                  <span className="truncate">
                    {r.customer.phone || "telefon eksik"}
                    {r.remainingAmount > 0 && (
                      <span className="ml-1 text-rm-champagne">
                        · {formatPrice(r.remainingAmount)}
                      </span>
                    )}
                  </span>
                </p>
              </button>
              <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
                {tel && (
                  <a
                    href={tel}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-rm-champagne transition-colors active:bg-rm-champagne/20 sm:h-8 sm:w-8 sm:hover:border-rm-champagne sm:hover:bg-rm-champagne sm:hover:text-rm-black"
                    title="Ara"
                    aria-label="Ara"
                  >
                    <Phone className="h-3.5 w-3.5" strokeWidth={1.7} />
                  </a>
                )}
                {wa && (
                  <a
                    href={wa}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-[#25D366]/35 bg-[#25D366]/10 text-[#25D366] transition-colors active:bg-[#25D366]/25 sm:h-8 sm:w-8 sm:hover:bg-[#25D366] sm:hover:text-white"
                    title="WhatsApp"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.7} />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => router.push(`/admin?tab=calendar&res=${r.id}`)}
                  className="hidden h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/[0.04] text-rm-gray-400 transition-colors hover:border-rm-champagne/40 hover:text-rm-champagne sm:flex"
                  title="Detay"
                  aria-label="Detay"
                >
                  <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.7} />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
