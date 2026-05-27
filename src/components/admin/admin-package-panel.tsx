"use client";

import { useCallback, useEffect, useState } from "react";
import type { PackageInsights } from "@/lib/package-insights";
import type { PackageDraftRecord } from "@/types/package-drafts";
import { formatPrice } from "@/lib/utils";
import {
  CreateReservationDialog,
  type ReservationFormInitial,
} from "@/components/admin/create-reservation-dialog";
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

  if (loading) return <p className="text-sm text-rm-gray-400">Yükleniyor…</p>;
  if (!insights) {
    return (
      <p className="text-sm text-rm-gray-400">Veri yüklenemedi. Sayfayı yenileyin.</p>
    );
  }

  const { totals, serviceStats, abandonedDrafts } = insights;

  return (
    <div className="space-y-10">
      <p className="text-sm text-rm-gray-400">
        Paket oluşturucudan gelen sepet verileri (otomatik kayıt). Yeni
        rezervasyon için{" "}
        <a href="/admin?tab=calendar" className="text-rm-champagne underline">
          Takvim
        </a>
        .
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Sepet oluşturan", value: totals.draftsWithCart },
          { label: "Teklif yaptı", value: totals.whatsappClicked },
          {
            label: "Teklif yapmadı",
            value: totals.abandoned,
            highlight: true,
          },
          { label: "Gelen teklif", value: totals.leads },
          { label: "Onaylı rezervasyon", value: totals.reservations },
        ].map((s) => (
          <div
            key={s.label}
            className={`rounded-sm border p-4 ${
              s.highlight
                ? "border-rm-champagne/40 bg-rm-champagne/5"
                : "border-white/10 bg-rm-black-elevated"
            }`}
          >
            <p className="text-2xl font-display text-rm-off-white">{s.value}</p>
            <p className="mt-1 text-[10px] tracking-wider text-rm-gray-500 uppercase">
              {s.label}
            </p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="font-display text-lg text-rm-champagne">
          En çok eklenen hizmetler
        </h3>
        <p className="mt-1 text-xs text-rm-gray-500">
          Kaç farklı oturumda sepete eklendi (teklif yapan + yapmayan).
        </p>
        {serviceStats.length === 0 ? (
          <p className="mt-4 text-sm text-rm-gray-500">Henüz veri yok.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-white/10 text-xs text-rm-gray-500 uppercase">
                  <th className="py-2 pr-4">Hizmet</th>
                  <th className="py-2">Kişi / oturum</th>
                </tr>
              </thead>
              <tbody>
                {serviceStats.slice(0, 40).map((row) => (
                  <tr key={row.serviceId} className="border-b border-white/5">
                    <td className="py-2.5 pr-4 text-rm-gray-300">{row.label}</td>
                    <td className="py-2.5 font-medium text-rm-champagne">
                      {row.count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h3 className="font-display text-lg text-rm-champagne">
          Teklif yapmadan ayrılanlar
        </h3>
        <p className="mt-1 text-xs text-rm-gray-500">
          Sepete hizmet eklemiş ama WhatsApp / teklif butonuna tıklamamış.
        </p>
        {abandonedDrafts.length === 0 ? (
          <p className="mt-4 text-sm text-rm-gray-500">
            Şu an bekleyen yarım sepet yok.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {abandonedDrafts.map((d) => (
              <li
                key={d.sessionId}
                className="rounded-sm border border-white/10 bg-rm-black-elevated p-4"
              >
                <div className="flex flex-wrap justify-between gap-2 text-xs text-rm-gray-500">
                  <span>
                    {new Date(d.updatedAt).toLocaleString("tr-TR")}
                  </span>
                  <span className="text-rm-champagne">Teklif yok</span>
                </div>
                {(d.customer.firstName || d.customer.phone) && (
                  <p className="mt-2 text-rm-off-white">
                    {d.customer.firstName} {d.customer.lastName}
                    {d.customer.phone && ` · ${d.customer.phone}`}
                  </p>
                )}
                {d.customer.weddingDate && (
                  <p className="text-sm text-rm-gray-400">
                    Düğün: {d.customer.weddingDate}
                  </p>
                )}
                <p className="mt-1 text-lg text-rm-champagne">
                  {formatPrice(d.total)}
                </p>
                <ul className="mt-2 text-sm text-rm-gray-400">
                  {d.lineDetails.slice(0, 8).map((l) => (
                    <li key={`${d.sessionId}-${l.label}`}>
                      · {l.label}
                      {l.price > 0 && ` — ${formatPrice(l.price)}`}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  onClick={() => openManual(draftToInitial(d))}
                  className="mt-3 border border-rm-champagne/40 px-3 py-2 text-xs tracking-wide text-rm-champagne uppercase"
                >
                  Rezervasyon yap (çift adına)
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

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
