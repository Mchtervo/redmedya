"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight, LayoutDashboard } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import type { LeadRecord } from "@/types/site-settings";
import { AdminVisualCalendar } from "@/components/admin/admin-visual-calendar";
import { AdminPanelHeader } from "@/components/admin/admin-panel-header";
import { AdminRevenueSummary } from "@/components/admin/admin-revenue-summary";
import { AdminThisWeekWeddings } from "@/components/admin/admin-this-week-weddings";
import { AdminActivityFeed } from "@/components/admin/admin-activity-feed";
import { AiCommandCenter } from "@/components/admin/admin-ai-command-center";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";

/**
 * Dashboard — sade: AI özeti (KPI + trend + kontenjan + ajanlar), bu haftanın düğünleri,
 * takvim + son hareketler, gelir özeti. Tekrarlayan sayaç kartları ve "yaklaşan düğünler"
 * listesi kaldırıldı (takvim ve "bu hafta" kartı aynı bilgiyi veriyor).
 */
export function AdminOverviewPanel({
  onNavigate,
}: {
  onNavigate: (tab: string) => void;
}) {
  const router = useRouter();
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/reservations").then((r) => r.json()),
      fetch("/api/admin/leads").then((r) => r.json()),
    ])
      .then(([res, ld]) => {
        setReservations(Array.isArray(res) ? res : []);
        setLeads(Array.isArray(ld) ? ld : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminDataSync(load);

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Genel bakış"
        title="Komuta Merkezi"
        icon={LayoutDashboard}
        actions={
          <Link
            href="/paket-olustur"
            target="_blank"
            className="rm-press inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700"
          >
            Siteyi aç
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        }
      />

      <AiCommandCenter onOpenAi={() => onNavigate("ai_couples")} reservations={reservations} />

      {loading ? (
        <div className="rm-card h-40 animate-pulse" />
      ) : (
        <>
          <AdminThisWeekWeddings reservations={reservations} />

          <div className="grid gap-5 xl:grid-cols-[1.1fr_1fr]">
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

          <AdminRevenueSummary reservations={reservations} />
        </>
      )}
    </div>
  );
}
