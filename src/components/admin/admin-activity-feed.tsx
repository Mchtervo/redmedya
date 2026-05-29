"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  Inbox,
  CalendarCheck2,
  XCircle,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import type { LeadRecord } from "@/types/site-settings";
import { formatPrice } from "@/lib/utils";
import { formatCustomerName } from "@/lib/customer-name";
import { AdminEmptyState } from "@/components/admin/admin-panel-header";

type FeedEvent = {
  id: string;
  at: number;
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  tint: string;
  href: string;
};

/**
 * Yeni teklif + onaylı rezervasyon + reddedilen tekliflerden son 10
 * hareketi tek bir akış halinde gösterir.
 */
export function AdminActivityFeed({
  reservations,
  leads,
}: {
  reservations: ReservationRecord[];
  leads: LeadRecord[];
}) {
  const router = useRouter();

  const events = useMemo<FeedEvent[]>(() => {
    const items: FeedEvent[] = [];

    for (const l of leads) {
      const name = formatCustomerName(l.customer) || "Adsız müşteri";
      if (l.status === "rejected") {
        items.push({
          id: `lead-rej-${l.id}`,
          at: new Date(l.createdAt).getTime(),
          title: `${name} teklifi reddedildi`,
          subtitle: formatPrice(l.cart.total),
          icon: XCircle,
          tint: "border-red-500/30 bg-red-500/10 text-red-300",
          href: "/admin?tab=leads",
        });
      } else {
        items.push({
          id: `lead-new-${l.id}`,
          at: new Date(l.createdAt).getTime(),
          title: `${name} yeni teklif gönderdi`,
          subtitle: `${l.cart.count} hizmet · ${formatPrice(l.cart.total)}`,
          icon: Inbox,
          tint: "border-rm-champagne/35 bg-rm-champagne/10 text-rm-champagne",
          href: "/admin?tab=leads",
        });
      }
    }

    for (const r of reservations) {
      const name = formatCustomerName(r.customer) || "Adsız çift";
      items.push({
        id: `res-${r.id}`,
        at: new Date(r.approvedAt || r.createdAt).getTime(),
        title: `${name} rezervasyonu oluşturuldu`,
        subtitle: formatPrice(r.total),
        icon: CalendarCheck2,
        tint: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
        href: `/admin?tab=calendar&res=${r.id}`,
      });
    }

    return items.sort((a, b) => b.at - a.at).slice(0, 10);
  }, [reservations, leads]);

  return (
    <div className="rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-4 backdrop-blur-sm sm:p-5 md:p-6">
      <div className="flex items-center justify-between border-b border-white/8 pb-3 sm:pb-4">
        <div className="flex items-center gap-2.5 sm:gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-rm-champagne/25 bg-rm-champagne/10 text-rm-champagne">
            <Activity className="h-4 w-4" strokeWidth={1.6} />
          </span>
          <h3 className="font-editorial text-lg text-rm-off-white sm:text-xl">
            Aktivite akışı
          </h3>
        </div>
        <span className="rounded-full bg-white/[0.04] px-2.5 py-0.5 text-[10px] tracking-[0.18em] text-rm-gray-500 uppercase">
          Son {events.length}
        </span>
      </div>

      {events.length === 0 ? (
        <AdminEmptyState
          icon={Activity}
          title="Henüz hareket yok"
          description="İlk teklif veya rezervasyon eklendiğinde burada listelenir."
        />
      ) : (
        <ul className="mt-2 divide-y divide-white/5">
          {events.map((e) => {
            const Icon = e.icon;
            return (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => router.push(e.href)}
                  className="group flex w-full items-center gap-3 py-3 text-left transition-colors hover:bg-white/[0.02]"
                >
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${e.tint}`}
                  >
                    <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-rm-off-white">
                      {e.title}
                    </p>
                    <p className="mt-0.5 text-xs text-rm-gray-500">
                      {timeAgo(e.at)}
                      {e.subtitle && (
                        <span className="ml-2 text-rm-gray-400">· {e.subtitle}</span>
                      )}
                    </p>
                  </div>
                  <ArrowRight
                    className="h-3.5 w-3.5 shrink-0 text-rm-gray-600 transition-all group-hover:translate-x-0.5 group-hover:text-rm-champagne"
                    strokeWidth={1.6}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function timeAgo(ts: number) {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Az önce";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)} dk önce`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)} saat önce`;
  if (diff < 7 * 86_400_000) return `${Math.floor(diff / 86_400_000)} gün önce`;
  return new Date(ts).toLocaleDateString("tr-TR");
}
