"use client";

import { useCallback, useEffect, useState } from "react";
import type { LeadRecord } from "@/types/site-settings";
import { formatPrice } from "@/lib/utils";
import { LeadApproveDialog } from "@/components/admin/lead-approve-dialog";
import {
  buildCustomerConfirmationMessage,
  getWhatsAppUrl,
} from "@/lib/whatsapp";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";
import { formatCustomerName } from "@/lib/customer-name";
import { formatWeddingSchedule } from "@/lib/date-format";
import { formatLeadLineLabel } from "@/lib/service-line";
import { cn } from "@/lib/utils";

export function AdminLeadsPanel() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [reservationIds, setReservationIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [approveLead, setApproveLead] = useState<LeadRecord | null>(null);
  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/leads").then((r) => r.json()),
      fetch("/api/admin/reservations").then((r) => r.json()),
    ])
      .then(([leadData, resData]) => {
        setLeads(Array.isArray(leadData) ? leadData : []);
        const ids = new Set<string>();
        if (Array.isArray(resData)) {
          for (const r of resData) {
            if (r?.id) ids.add(r.id);
          }
        }
        setReservationIds(ids);
      })
      .catch(() => {
        setLeads([]);
        setReservationIds(new Set());
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminDataSync(load);

  const shareWithCustomer = (lead: LeadRecord) => {
    const services =
      lead.lineDetails ??
      lead.cart.lineSummary.map((label) => ({ label, price: 0 }));
    const total = lead.cart.total;
    const deposit = 0;
    const msg = buildCustomerConfirmationMessage({
      customerName: lead.customer.firstName || "değerli müşterimiz",
      weddingDate: lead.customer.weddingDate,
      services,
      subtotal: lead.cart.subtotal,
      bundleDiscount: lead.bundleDiscount ?? 0,
      couponDiscount: lead.couponDiscount ?? 0,
      total,
      depositAmount: deposit,
      remainingAmount: total - deposit,
    });
    window.open(
      getWhatsAppUrl(msg, lead.customer.phone),
      "_blank",
      "noopener,noreferrer"
    );
  };

  if (loading) return <p className="text-sm text-rm-gray-400">Yükleniyor…</p>;

  const hasLiveReservation = (lead: LeadRecord) =>
    Boolean(lead.reservationId && reservationIds.has(lead.reservationId));

  const pending = leads.filter((l) => {
    if (l.status === "rejected") return false;
    if (l.status === "pending") return true;
    if (l.status === "approved") return !hasLiveReservation(l);
    return false;
  });

  const leadStatus = (lead: LeadRecord) => {
    if (lead.status === "rejected") {
      return { label: "Reddedildi", className: "text-red-400/90" };
    }
    if (lead.status === "approved" && hasLiveReservation(lead)) {
      return { label: "Onaylandı", className: "text-emerald-400" };
    }
    if (lead.status === "approved") {
      return { label: "Rezervasyon silindi", className: "text-amber-400" };
    }
    return { label: "Bekliyor", className: "text-rm-champagne" };
  };

  const canApprove = (lead: LeadRecord) =>
    lead.status !== "rejected" && !hasLiveReservation(lead);

  const canReject = (lead: LeadRecord) =>
    lead.status === "pending" && !hasLiveReservation(lead);

  const rejectLead = async (lead: LeadRecord) => {
    if (
      !window.confirm(
        `${formatCustomerName(lead.customer)} teklifini reddetmek istediğinize emin misiniz?`
      )
    ) {
      return;
    }
    const res = await fetch(`/api/admin/leads/${lead.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "reject" }),
    });
    if (res.ok) {
      notifyAdminDataChanged();
      load();
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-rm-gray-400">
        {pending.length} bekleyen · {leads.length} toplam teklif · Yeni
        rezervasyon için{" "}
        <a href="/admin?tab=calendar" className="text-rm-champagne underline">
          Takvim
        </a>
      </p>

      {leads.length === 0 ? (
        <p className="text-sm text-rm-gray-400">
          Henüz kayıt yok. Müşteri paket oluşturup WhatsApp ile teklif aldığında
          burada görünür.
        </p>
      ) : (
        leads.map((lead) => {
          const status = leadStatus(lead);
          return (
          <article
            key={lead.id}
            className={cn(
              "rounded-sm border p-5",
              lead.status === "rejected"
                ? "border-red-500/20 bg-red-950/10 opacity-80"
                : "border-white/10 bg-rm-black-elevated"
            )}
          >
            <div className="flex flex-wrap justify-between gap-2 text-xs text-rm-gray-500">
              <span>{new Date(lead.createdAt).toLocaleString("tr-TR")}</span>
              <span className="flex gap-2">
                <span>{lead.source}</span>
                <span className={status.className}>{status.label}</span>
              </span>
            </div>
            <p className="mt-2 font-medium text-rm-off-white">
              {formatCustomerName(lead.customer)} ·{" "}
              {lead.customer.phone}
            </p>
            {formatWeddingSchedule(
              lead.customer.weddingDate,
              lead.customer.weddingTime
            ) && (
              <p className="text-sm text-rm-gray-400">
                Düğün:{" "}
                {formatWeddingSchedule(
                  lead.customer.weddingDate,
                  lead.customer.weddingTime
                )}
              </p>
            )}
            <p className="mt-2 text-lg text-rm-champagne">
              {formatPrice(lead.cart.total)}
            </p>
            <ul className="mt-2 space-y-1 text-sm text-rm-gray-400">
              {(lead.lineDetails ?? lead.cart.lineSummary.map((l) => ({ label: l, price: 0 }))).map(
                (line) => (
                  <li key={line.label}>
                    · {formatLeadLineLabel(line)}
                    {line.price > 0 && (
                      <span className="text-rm-gray-500">
                        {" "}
                        — {formatPrice(line.price)}
                      </span>
                    )}
                  </li>
                )
              )}
            </ul>

            <div className="mt-4 flex flex-wrap gap-2">
              {canApprove(lead) && (
                <>
                  <button
                    type="button"
                    onClick={() => setApproveLead(lead)}
                    className="bg-rm-champagne px-4 py-2 text-xs font-bold tracking-wide text-rm-black uppercase"
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    onClick={() => shareWithCustomer(lead)}
                    className="border border-white/20 px-4 py-2 text-xs tracking-wide text-rm-off-white uppercase hover:border-rm-champagne/40"
                  >
                    Müşteriyle paylaş
                  </button>
                  {canReject(lead) && (
                    <button
                      type="button"
                      onClick={() => rejectLead(lead)}
                      className="border border-red-500/40 px-4 py-2 text-xs tracking-wide text-red-300 uppercase hover:bg-red-500/10"
                    >
                      Teklifi reddet
                    </button>
                  )}
                </>
              )}
              {hasLiveReservation(lead) && lead.reservationId && (
                <a
                  href={`/admin?tab=calendar&res=${lead.reservationId}`}
                  className="border border-rm-champagne/30 px-4 py-2 text-xs text-rm-champagne uppercase"
                >
                  Takvimde gör
                </a>
              )}
            </div>
          </article>
          );
        })
      )}

      <LeadApproveDialog
        lead={approveLead}
        open={Boolean(approveLead)}
        onOpenChange={(o) => !o && setApproveLead(null)}
        onApproved={load}
      />

    </div>
  );
}
