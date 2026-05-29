"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ShoppingCart,
  ShoppingBag,
  MessageCircle,
  Sparkles,
  CalendarCheck2,
  TrendingUp,
  Clock,
  Plus,
} from "lucide-react";
import type { PackageInsights } from "@/lib/package-insights";
import type { PackageDraftRecord } from "@/types/package-drafts";
import { formatPrice } from "@/lib/utils";
import {
  CreateReservationDialog,
  type ReservationFormInitial,
} from "@/components/admin/create-reservation-dialog";
import {
  AdminPanelHeader,
  AdminSection,
  AdminEmptyState,
} from "@/components/admin/admin-panel-header";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";

export function AdminPackagePanel() {
  const [insights, setInsights] = useState<PackageInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogInitial, setDialogInitial] = useState<ReservationFormInitial | null>(
    null
  );

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/package-insights")
      .then((r) => r.json())
      .then(setInsights)
      .catch(() => setInsights(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminDataSync(load);

  const openManual = (initial?: ReservationFormInitial) => {
    setDialogInitial(initial ?? null);
    setDialogOpen(true);
  };

  const draftToInitial = (d: PackageDraftRecord): ReservationFormInitial => ({
    customer: d.customer,
    services: d.lineDetails,
    subtotal: d.subtotal,
    total: d.total,
    draftSessionId: d.sessionId,
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader eyebrow="Sepetler" title="Paket istatistikleri" icon={ShoppingCart} />
        <div className="h-32 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }
  if (!insights) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader eyebrow="Sepetler" title="Paket istatistikleri" icon={ShoppingCart} />
        <AdminEmptyState
          icon={ShoppingCart}
          title="Veri yüklenemedi"
          description="Sayfayı yenileyin veya oturumun açık olduğundan emin olun."
        />
      </div>
    );
  }

  const { totals, serviceStats, abandonedDrafts } = insights;

  const stats = [
    {
      label: "Sepet oluşturan",
      value: totals.draftsWithCart,
      icon: ShoppingBag,
      accent: "text-rose-300",
    },
    {
      label: "Teklif yaptı",
      value: totals.whatsappClicked,
      icon: MessageCircle,
      accent: "text-emerald-300",
    },
    {
      label: "Teklif yapmadı",
      value: totals.abandoned,
      icon: Clock,
      accent: "text-amber-300",
      highlight: true,
    },
    {
      label: "Gelen teklif",
      value: totals.leads,
      icon: TrendingUp,
      accent: "text-rm-champagne",
    },
    {
      label: "Onaylı rezervasyon",
      value: totals.reservations,
      icon: CalendarCheck2,
      accent: "text-cyan-300",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Sepetler"
        title="Paket istatistikleri"
        description="Paket oluşturucudan gelen sepet verileri burada otomatik toplanır. Yarım sepetleri tek tıkla rezervasyona dönüştürebilirsiniz."
        icon={ShoppingCart}
        meta={`${totals.draftsWithCart} sepet · ${totals.leads} teklif · ${totals.reservations} rezervasyon`}
        actions={
          <a
            href="/admin?tab=calendar"
            className="inline-flex items-center gap-2 rounded-full border border-rm-champagne/30 bg-rm-champagne/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-rm-champagne uppercase transition-colors hover:border-rm-champagne hover:bg-rm-champagne hover:text-rm-black"
          >
            <CalendarCheck2 className="h-3.5 w-3.5" />
            Takvim
          </a>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <div
              key={s.label}
              className={`relative overflow-hidden rounded-2xl border p-5 backdrop-blur-sm ${
                s.highlight
                  ? "border-rm-champagne/35 bg-rm-champagne/[0.06]"
                  : "border-white/8 bg-rm-black-elevated/60"
              }`}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-rm-champagne">
                <Icon className="h-4 w-4" strokeWidth={1.6} />
              </span>
              <p className={`mt-3 font-editorial text-3xl tabular-nums ${s.accent}`}>
                {s.value}
              </p>
              <p className="mt-1 text-[10px] font-semibold tracking-[0.22em] text-rm-gray-500 uppercase">
                {s.label}
              </p>
            </div>
          );
        })}
      </div>

      <AdminSection
        title="En çok eklenen hizmetler"
        description="Kaç farklı oturumda sepete eklendi (teklif yapan + yapmayan)."
        icon={Sparkles}
      >
        {serviceStats.length === 0 ? (
          <AdminEmptyState
            icon={Sparkles}
            title="Henüz veri yok"
            description="Müşteriler paket oluşturmaya başladığında popüler hizmetler burada görünür."
          />
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/8">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-[10px] tracking-[0.2em] text-rm-gray-500 uppercase">
                  <th className="px-4 py-2.5">Hizmet</th>
                  <th className="px-4 py-2.5 text-right">Oturum sayısı</th>
                </tr>
              </thead>
              <tbody>
                {serviceStats.slice(0, 40).map((row) => (
                  <tr
                    key={row.serviceId}
                    className="border-t border-white/5 transition-colors hover:bg-white/[0.02]"
                  >
                    <td className="px-4 py-2.5 text-rm-off-white">{row.label}</td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-rm-champagne">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      <AdminSection
        title="Teklif yapmadan ayrılanlar"
        description="Sepete hizmet eklemiş ama WhatsApp / teklif butonuna basmamış müşteriler."
        icon={Clock}
      >
        {abandonedDrafts.length === 0 ? (
          <AdminEmptyState
            icon={Clock}
            title="Bekleyen yarım sepet yok"
            description="Tüm sepet sahipleri teklif gönderdi veya henüz oluşturma başlamadı."
          />
        ) : (
          <ul className="space-y-3">
            {abandonedDrafts.map((d) => (
              <li
                key={d.sessionId}
                className="rounded-xl border border-white/8 bg-white/[0.02] p-4 transition-colors hover:border-rm-champagne/25"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] tracking-[0.18em] text-rm-gray-500 uppercase">
                  <span>{new Date(d.updatedAt).toLocaleString("tr-TR")}</span>
                  <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-amber-300">
                    Teklif yok
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-3">
                  <div>
                    {(d.customer.firstName || d.customer.phone) ? (
                      <p className="font-editorial text-lg text-rm-off-white">
                        {d.customer.firstName} {d.customer.lastName}
                        {d.customer.phone && (
                          <span className="ml-2 text-sm font-normal text-rm-gray-400">
                            · {d.customer.phone}
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="font-editorial text-lg text-rm-gray-500">
                        İletişim bilgisi yok
                      </p>
                    )}
                    {d.customer.weddingDate && (
                      <p className="mt-0.5 text-xs text-rm-gray-500">
                        Düğün: {d.customer.weddingDate}
                      </p>
                    )}
                  </div>
                  <p className="font-editorial text-2xl tabular-nums text-rm-champagne">
                    {formatPrice(d.total)}
                  </p>
                </div>
                <ul className="mt-3 grid gap-1 text-sm text-rm-gray-400 sm:grid-cols-2">
                  {d.lineDetails.slice(0, 8).map((l) => (
                    <li
                      key={`${d.sessionId}-${l.label}`}
                      className="flex items-start gap-2 rounded-lg bg-white/[0.02] px-2.5 py-1.5"
                    >
                      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-rm-champagne/60" />
                      <span className="min-w-0 flex-1 truncate">
                        {l.label}
                        {l.price > 0 && (
                          <span className="ml-1 text-rm-gray-500">
                            {formatPrice(l.price)}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => openManual(draftToInitial(d))}
                  className="mt-4 inline-flex items-center gap-2 rounded-full border border-rm-champagne/40 bg-rm-champagne/10 px-4 py-2 text-[11px] font-bold tracking-[0.18em] text-rm-champagne uppercase transition-colors hover:bg-rm-champagne hover:text-rm-black"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.2} />
                  Rezervasyon yap
                </button>
              </li>
            ))}
          </ul>
        )}
      </AdminSection>

      <CreateReservationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={dialogInitial}
        onCreated={() => {
          load();
          notifyAdminDataChanged();
        }}
      />
    </div>
  );
}
