"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import type { PackageInsights } from "@/lib/package-insights";
import { AdminVisualCalendar } from "@/components/admin/admin-visual-calendar";
import { formatPrice } from "@/lib/utils";
import { formatWeddingDateDisplay } from "@/lib/date-format";
import { EASE_LUXURY } from "@/lib/animations";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { formatCustomerName } from "@/lib/customer-name";

export function AdminOverviewPanel({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [insights, setInsights] = useState<PackageInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/reservations").then((r) => r.json()),
      fetch("/api/admin/package-insights").then((r) => r.json()),
    ])
      .then(([res, ins]) => {
        setReservations(Array.isArray(res) ? res : []);
        setInsights(ins);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminDataSync(load);

  const upcoming = [...reservations]
    .filter((r) => r.customer.weddingDate)
    .sort(
      (a, b) =>
        new Date(a.customer.weddingDate).getTime() -
        new Date(b.customer.weddingDate).getTime()
    )
    .slice(0, 5);

  const stats = [
    {
      label: "Onaylı rezervasyon",
      value: reservations.length,
      tab: "calendar",
    },
    {
      label: "Bekleyen teklif",
      value: insights?.totals.abandoned ?? 0,
      tab: "packages",
    },
    {
      label: "WhatsApp teklif",
      value: insights?.totals.leads ?? 0,
      tab: "leads",
    },
    {
      label: "Sepet oluşturan",
      value: insights?.totals.draftsWithCart ?? 0,
      tab: "packages",
    },
  ];

  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE_LUXURY }}
        className="relative overflow-hidden rounded-2xl border border-rm-champagne/20 bg-gradient-to-br from-rm-champagne/15 via-rm-black-elevated to-rm-black p-8 md:p-10"
      >
        <div
          className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rm-champagne/10 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="flex items-center gap-2 text-[10px] font-bold tracking-[0.35em] text-rm-champagne uppercase">
              <Sparkles className="h-3.5 w-3.5" />
              REDMEDYA kontrol merkezi
            </p>
            <h1 className="mt-3 font-editorial text-[clamp(2rem,5vw,3.25rem)] leading-tight text-rm-off-white">
              Hoş geldiniz
            </h1>
            <p className="mt-2 max-w-lg text-sm text-rm-gray-400">
              Takvim, teklifler ve site fiyatları tek panelden. CMS kaydı anında
              paket sayfasına yansır.
            </p>
          </div>
          <Link
            href="/paket-olustur"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-semibold tracking-wide text-rm-off-white uppercase backdrop-blur hover:border-rm-champagne/40"
          >
            Siteyi aç
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </motion.header>

      {loading ? (
        <p className="text-sm text-rm-gray-500">Yükleniyor…</p>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((s, i) => (
              <motion.button
                key={s.label}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, ease: EASE_LUXURY }}
                onClick={() => onNavigate(s.tab)}
                className="rounded-xl border border-white/10 bg-rm-black-elevated/80 p-5 text-left transition-all hover:border-rm-champagne/35 hover:bg-rm-champagne/5"
              >
                <p className="text-3xl font-display text-rm-champagne">{s.value}</p>
                <p className="mt-2 text-xs tracking-wide text-rm-gray-500 uppercase">
                  {s.label}
                </p>
              </motion.button>
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
            <AdminVisualCalendar
              reservations={reservations}
              onDayClick={(iso, events) => {
                if (events.length === 0) {
                  router.push(`/admin?tab=calendar&newDate=${iso}`);
                } else if (events.length === 1) {
                  router.push(`/admin?tab=calendar&res=${events[0].id}`);
                } else {
                  onNavigate("calendar");
                }
              }}
            />

            <div className="rounded-xl border border-white/10 bg-rm-black-elevated/60 p-5">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-lg text-rm-off-white">
                  Yaklaşan düğünler
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigate("calendar")}
                  className="text-xs text-rm-champagne hover:underline"
                >
                  Takvime git →
                </button>
              </div>
              {upcoming.length === 0 ? (
                <p className="mt-6 text-sm text-rm-gray-500">
                  Henüz onaylı rezervasyon yok.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {upcoming.map((r) => (
                    <li
                      key={r.id}
                      className="rounded-lg border border-white/8 bg-white/[0.02] px-4 py-3"
                    >
                      <p className="font-medium text-rm-off-white">
                        {formatCustomerName(r.customer)}
                      </p>
                      <p className="text-xs text-rm-gray-500">
                        {formatWeddingDateDisplay(r.customer.weddingDate)}
                      </p>
                      <p className="mt-1 text-sm text-rm-champagne">
                        Kalan {formatPrice(r.remainingAmount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
