"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  CalendarCheck2,
  Heart,
  Inbox,
  LayoutDashboard,
  ShoppingBag,
} from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import type { LeadRecord } from "@/types/site-settings";
import type { PackageInsights } from "@/lib/package-insights";
import { AdminVisualCalendar } from "@/components/admin/admin-visual-calendar";
import { AdminPanelHeader, AdminEmptyState } from "@/components/admin/admin-panel-header";
import { AdminRevenueSummary } from "@/components/admin/admin-revenue-summary";
import { AdminThisWeekWeddings } from "@/components/admin/admin-this-week-weddings";
import { AdminActivityFeed } from "@/components/admin/admin-activity-feed";
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
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [insights, setInsights] = useState<PackageInsights | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/reservations").then((r) => r.json()),
      fetch("/api/admin/package-insights").then((r) => r.json()),
      fetch("/api/admin/leads").then((r) => r.json()),
    ])
      .then(([res, ins, ld]) => {
        setReservations(Array.isArray(res) ? res : []);
        setInsights(ins);
        setLeads(Array.isArray(ld) ? ld : []);
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
      icon: CalendarCheck2,
      accent: "text-emerald-300",
    },
    {
      label: "WhatsApp teklif",
      value: insights?.totals.leads ?? 0,
      tab: "leads",
      icon: Inbox,
      accent: "text-rm-champagne",
    },
    {
      label: "Bekleyen sepet",
      value: insights?.totals.abandoned ?? 0,
      tab: "packages",
      icon: ShoppingBag,
      accent: "text-amber-300",
    },
    {
      label: "Sepet oluşturan",
      value: insights?.totals.draftsWithCart ?? 0,
      tab: "packages",
      icon: Heart,
      accent: "text-rose-300",
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        eyebrow="Genel bakış"
        title="Hoş geldiniz"
        description="Bugüne kadar gelen tüm teklifleri, onaylı rezervasyonları ve takvim doluluğunuzu tek ekrandan takip edin."
        icon={LayoutDashboard}
        meta={
          loading
            ? "Veriler yükleniyor…"
            : `${reservations.length} rezervasyon · ${insights?.totals.leads ?? 0} teklif · ${insights?.totals.draftsWithCart ?? 0} sepet`
        }
        actions={
          <Link
            href="/paket-olustur"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full border border-rm-champagne/30 bg-rm-champagne/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-rm-champagne uppercase transition-colors hover:border-rm-champagne hover:bg-rm-champagne hover:text-rm-black"
          >
            Siteyi aç
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40 sm:h-32"
            />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <motion.button
                  key={s.label}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, ease: EASE_LUXURY }}
                  onClick={() => onNavigate(s.tab)}
                  className="group relative overflow-hidden rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-3.5 text-left backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-rm-champagne/35 hover:bg-rm-black-elevated sm:p-5"
                >
                  <div className="flex items-start justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-rm-champagne sm:h-10 sm:w-10">
                      <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.6} />
                    </span>
                    <ArrowRight className="h-3.5 w-3.5 text-rm-gray-600 transition-all group-hover:translate-x-0.5 group-hover:text-rm-champagne" />
                  </div>
                  <p className={`mt-3 font-editorial text-3xl leading-none tabular-nums sm:mt-4 sm:text-4xl ${s.accent}`}>
                    {s.value}
                  </p>
                  <p className="mt-1 text-[9px] font-semibold tracking-[0.22em] text-rm-gray-500 uppercase sm:text-[10px] sm:tracking-[0.25em]">
                    {s.label}
                  </p>
                </motion.button>
              );
            })}
          </div>

          <AdminThisWeekWeddings reservations={reservations} />

          <AdminRevenueSummary reservations={reservations} />

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

            <AdminActivityFeed reservations={reservations} leads={leads} />
          </div>

          <div className="rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-4 backdrop-blur-sm sm:p-5 md:p-6">
            <div className="flex items-center justify-between border-b border-white/8 pb-3 sm:pb-4">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-rm-champagne/25 bg-rm-champagne/10 text-rm-champagne">
                  <Heart className="h-4 w-4" strokeWidth={1.6} />
                </span>
                <h3 className="font-editorial text-lg text-rm-off-white sm:text-xl">
                  Yaklaşan düğünler
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onNavigate("calendar")}
                className="inline-flex items-center gap-1 text-[10px] font-semibold tracking-[0.2em] text-rm-champagne uppercase hover:underline"
              >
                Takvim
                <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            {upcoming.length === 0 ? (
              <AdminEmptyState
                icon={Heart}
                title="Henüz onaylı düğün yok"
                description="Yeni rezervasyon eklediğinizde burada listelenir."
              />
            ) : (
              <ul className="mt-2 divide-y divide-white/5">
                {upcoming.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin?tab=calendar&res=${r.id}`)}
                      className="group flex w-full items-center justify-between gap-3 py-3.5 text-left transition-colors hover:bg-white/[0.02]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-rm-off-white">
                          {formatCustomerName(r.customer)}
                        </p>
                        <p className="mt-0.5 text-xs text-rm-gray-500">
                          {formatWeddingDateDisplay(r.customer.weddingDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] tracking-wider text-rm-gray-500 uppercase">
                          Kalan
                        </p>
                        <p className="text-sm font-semibold tabular-nums text-rm-champagne">
                          {formatPrice(r.remainingAmount)}
                        </p>
                      </div>
                      <ArrowRight className="ml-1 h-3.5 w-3.5 text-rm-gray-600 transition-all group-hover:translate-x-0.5 group-hover:text-rm-champagne" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  );
}
