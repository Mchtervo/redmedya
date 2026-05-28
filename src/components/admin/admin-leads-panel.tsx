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
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/8 bg-rm-black-elevated/40 px-4 py-3">
        <p className="text-sm text-rm-gray-400">
          <span className="font-semibold text-rm-champagne">{pending.length}</span>{" "}
          bekleyen · {leads.length} toplam teklif
        </p>
        <a
          href="/admin?tab=calendar"
          className="text-xs font-semibold tracking-wider text-rm-champagne uppercase hover:underline"
        >
          Takvime git →
        </a>
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-12 text-center">
          <p className="text-sm text-rm-gray-400">
            Henüz kayıt yok. Müşteri paket oluşturup WhatsApp ile teklif aldığında
            burada görünür.
          </p>
        </div>
      ) : (
        leads.map((lead) => {
          const status = leadStatus(lead);
          return (
          <article
            key={lead.id}
            className={cn(
              "group rounded-xl border p-6 transition-all",
              lead.status === "rejected"
                ? "border-red-500/20 bg-red-950/10 opacity-70"
                : "border-white/8 bg-rm-black-elevated/60 hover:border-rm-champagne/25 hover:bg-rm-black-elevated"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[10px] tracking-[0.15em] text-rm-gray-500 uppercase">
                <span>{new Date(lead.createdAt).toLocaleString("tr-TR")}</span>
                <span className="text-rm-gray-600">·</span>
                <span>{lead.source}</span>
              </div>
              <span
                className={cn(
                  "rounded-full border px-2.5 py-0.5 text-[10px] font-semibold tracking-wider uppercase",
                  status.className,
                  lead.status === "rejected"
                    ? "border-red-500/30"
                    : lead.status === "approved" && hasLiveReservation(lead)
                      ? "border-emerald-500/30"
                      : lead.status === "approved"
                        ? "border-amber-500/30"
                        : "border-rm-champagne/30"
                )}
              >
                {status.label}
              </span>
            </div>

            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-white/8 pb-4">
              <div>
                <p className="font-editorial text-xl text-rm-off-white">
                  {formatCustomerName(lead.customer)}
                </p>
                <p className="mt-0.5 text-sm text-rm-gray-400">
                  {lead.customer.phone}
                </p>
                {formatWeddingSchedule(
                  lead.customer.weddingDate,
                  lead.customer.weddingTime
                ) && (
                  <p className="mt-1 text-xs text-rm-gray-500">
                    Düğün:{" "}
                    {formatWeddingSchedule(
                      lead.customer.weddingDate,
                      lead.customer.weddingTime
                    )}
                  </p>
                )}
              </div>
              <p className="font-editorial text-2xl tabular-nums text-rm-champagne">
                {formatPrice(lead.cart.total)}
              </p>
            </div>

            <ul className="mt-4 space-y-1.5 text-sm text-rm-gray-300">
              {(lead.lineDetails ?? lead.cart.lineSummary.map((l) => ({ label: l, price: 0 }))).map(
                (line) => (
                  <li key={line.label} className="flex items-start gap-2">
                    <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-rm-champagne/60" />
                    <span className="flex-1">
                      {formatLeadLineLabel(line)}
                      {line.price > 0 && (
                        <span className="ml-1 text-rm-gray-500">
                          — {formatPrice(line.price)}
                        </span>
                      )}
                    </span>
                  </li>
                )
              )}
            </ul>

            <div className="mt-5 flex flex-wrap gap-2">
              {canApprove(lead) && (
                <>
                  <button
                    type="button"
                    onClick={() => setApproveLead(lead)}
                    className="rounded-full bg-rm-champagne px-5 py-2 text-[11px] font-bold tracking-[0.15em] text-rm-black uppercase transition-colors hover:bg-rm-champagne-light"
                  >
                    Onayla
                  </button>
                  <button
                    type="button"
                    onClick={() => shareWithCustomer(lead)}
                    className="rounded-full border border-white/20 bg-white/[0.03] px-5 py-2 text-[11px] font-semibold tracking-[0.15em] text-rm-off-white uppercase transition-colors hover:border-rm-champagne/40 hover:bg-rm-champagne/10"
                  >
                    Müşteriyle paylaş
                  </button>
                  {canReject(lead) && (
                    <button
                      type="button"
                      onClick={() => rejectLead(lead)}
                      className="rounded-full border border-red-500/30 bg-transparent px-5 py-2 text-[11px] font-semibold tracking-[0.15em] text-red-300 uppercase transition-colors hover:bg-red-500/10"
                    >
                      Reddet
                    </button>
                  )}
                </>
              )}
              {hasLiveReservation(lead) && lead.reservationId && (
                <a
                  href={`/admin?tab=calendar&res=${lead.reservationId}`}
                  className="rounded-full border border-emerald-500/30 bg-emerald-500/[0.04] px-5 py-2 text-[11px] font-semibold tracking-[0.15em] text-emerald-300 uppercase transition-colors hover:bg-emerald-500/10"
                >
                  Takvimde gör →
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
