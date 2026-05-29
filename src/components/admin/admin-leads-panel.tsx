"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Inbox, Calendar, Check, MessageCircle, Phone, X, FileX } from "lucide-react";
import type { LeadRecord } from "@/types/site-settings";
import { formatPrice } from "@/lib/utils";
import { LeadApproveDialog } from "@/components/admin/lead-approve-dialog";
import {
  AdminPanelHeader,
  AdminEmptyState,
} from "@/components/admin/admin-panel-header";
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

type LeadFilter = "pending" | "approved" | "rejected" | "all";

export function AdminLeadsPanel() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [reservationIds, setReservationIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [approveLead, setApproveLead] = useState<LeadRecord | null>(null);
  const [filter, setFilter] = useState<LeadFilter>("pending");
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

  const hasLiveReservation = useCallback(
    (lead: LeadRecord) =>
      Boolean(lead.reservationId && reservationIds.has(lead.reservationId)),
    [reservationIds]
  );

  const counts = useMemo(() => {
    let pending = 0;
    let approved = 0;
    let rejected = 0;
    for (const l of leads) {
      if (l.status === "rejected") {
        rejected++;
        continue;
      }
      if (l.status === "approved" && hasLiveReservation(l)) {
        approved++;
        continue;
      }
      pending++;
    }
    return { pending, approved, rejected, all: leads.length };
  }, [leads, hasLiveReservation]);

  const visibleLeads = useMemo(() => {
    return leads.filter((l) => {
      if (filter === "all") return true;
      if (filter === "rejected") return l.status === "rejected";
      const live = hasLiveReservation(l);
      if (filter === "approved") return l.status === "approved" && live;
      if (filter === "pending") {
        if (l.status === "rejected") return false;
        return !(l.status === "approved" && live);
      }
      return true;
    });
  }, [leads, filter, hasLiveReservation]);

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader
          eyebrow="Teklifler"
          title="WhatsApp talepleri"
          icon={Inbox}
        />
        <div className="h-32 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
        <div className="h-48 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }

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

  const filterTabs: { id: LeadFilter; label: string; count: number; tint: string }[] = [
    {
      id: "pending",
      label: "Bekleyen",
      count: counts.pending,
      tint: "border-rm-champagne/40 bg-rm-champagne/15 text-rm-champagne",
    },
    {
      id: "approved",
      label: "Onaylı",
      count: counts.approved,
      tint: "border-emerald-500/30 bg-emerald-500/12 text-emerald-300",
    },
    {
      id: "rejected",
      label: "Reddedildi",
      count: counts.rejected,
      tint: "border-red-500/30 bg-red-500/12 text-red-300",
    },
    {
      id: "all",
      label: "Tümü",
      count: counts.all,
      tint: "border-white/20 bg-white/[0.06] text-rm-off-white",
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Teklifler"
        title="WhatsApp talepleri"
        description="Müşteriler paket oluşturup WhatsApp butonuna tıkladığında ilgili sepet özetleri burada toplanır."
        icon={Inbox}
        meta={`${counts.pending} bekleyen · ${counts.approved} onaylı · ${counts.all} toplam`}
        actions={
          <a
            href="/admin?tab=calendar"
            className="inline-flex items-center gap-2 rounded-full border border-rm-champagne/30 bg-rm-champagne/10 px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-rm-champagne uppercase transition-colors hover:border-rm-champagne hover:bg-rm-champagne hover:text-rm-black"
          >
            <Calendar className="h-3.5 w-3.5" />
            Takvim
          </a>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => {
          const active = filter === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all",
                active
                  ? tab.tint
                  : "border-white/10 bg-white/[0.02] text-rm-gray-500 hover:border-white/20 hover:text-rm-off-white"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] tabular-nums",
                  active ? "bg-black/30" : "bg-white/[0.04]"
                )}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {visibleLeads.length === 0 ? (
        leads.length === 0 ? (
          <AdminEmptyState
            icon={Inbox}
            title="Henüz teklif yok"
            description="Müşteri paket oluşturup WhatsApp ile teklif gönderdiğinde burada listelenir."
          />
        ) : (
          <AdminEmptyState
            icon={FileX}
            title="Bu filtrede kayıt yok"
            description="Diğer filtreleri deneyin veya 'Tümü' sekmesine geçin."
          />
        )
      ) : (
        visibleLeads.map((lead) => {
          const status = leadStatus(lead);
          const live = hasLiveReservation(lead);
          const statusBorder =
            lead.status === "rejected"
              ? "border-red-500/30"
              : lead.status === "approved" && live
                ? "border-emerald-500/30"
                : lead.status === "approved"
                  ? "border-amber-500/30"
                  : "border-rm-champagne/30";
          return (
          <article
            key={lead.id}
            className={cn(
              "group relative overflow-hidden rounded-2xl border p-6 transition-all",
              lead.status === "rejected"
                ? "border-red-500/20 bg-red-950/10 opacity-75"
                : "border-white/8 bg-rm-black-elevated/60 hover:-translate-y-0.5 hover:border-rm-champagne/30 hover:bg-rm-black-elevated"
            )}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-rm-champagne/[0.04] blur-3xl transition-opacity group-hover:bg-rm-champagne/[0.07]"
            />
            <div className="relative">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-[10px] tracking-[0.18em] text-rm-gray-500 uppercase">
                  <span>{new Date(lead.createdAt).toLocaleString("tr-TR")}</span>
                  <span className="text-rm-gray-700">·</span>
                  <span className="rounded-full bg-white/[0.04] px-2 py-0.5">
                    {lead.source}
                  </span>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-3 py-1 text-[10px] font-bold tracking-[0.18em] uppercase",
                    status.className,
                    statusBorder
                  )}
                >
                  {status.label}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap items-baseline justify-between gap-3 border-b border-white/8 pb-4">
                <div className="min-w-0">
                  <p className="font-editorial text-2xl text-rm-off-white">
                    {formatCustomerName(lead.customer)}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-rm-gray-400">
                    <Phone className="h-3.5 w-3.5 text-rm-champagne/70" strokeWidth={1.6} />
                    {lead.customer.phone || "—"}
                  </p>
                  {formatWeddingSchedule(
                    lead.customer.weddingDate,
                    lead.customer.weddingTime
                  ) && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rm-gray-500">
                      <Calendar className="h-3 w-3 text-rm-gray-500" strokeWidth={1.6} />
                      {formatWeddingSchedule(
                        lead.customer.weddingDate,
                        lead.customer.weddingTime
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-semibold tracking-[0.25em] text-rm-gray-500 uppercase">
                    Sepet toplamı
                  </p>
                  <p className="mt-0.5 font-editorial text-3xl leading-none tabular-nums text-rm-champagne">
                    {formatPrice(lead.cart.total)}
                  </p>
                </div>
              </div>

              <ul className="mt-4 grid gap-1.5 text-sm text-rm-gray-300 sm:grid-cols-2">
                {(lead.lineDetails ?? lead.cart.lineSummary.map((l) => ({ label: l, price: 0 }))).map(
                  (line) => (
                    <li
                      key={line.label}
                      className="flex items-start gap-2 rounded-lg bg-white/[0.02] px-3 py-2"
                    >
                      <span className="mt-1.5 inline-block h-1 w-1 shrink-0 rounded-full bg-rm-champagne/60" />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-rm-off-white">
                          {formatLeadLineLabel(line)}
                        </span>
                        {line.price > 0 && (
                          <span className="text-[11px] text-rm-gray-500">
                            {formatPrice(line.price)}
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
                      className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase shadow-[0_6px_22px_rgba(196,160,82,0.3)] transition-all hover:-translate-y-0.5 hover:bg-rm-champagne-light"
                    >
                      <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                      Onayla
                    </button>
                    <button
                      type="button"
                      onClick={() => shareWithCustomer(lead)}
                      className="inline-flex items-center gap-2 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-[#25D366] uppercase transition-colors hover:bg-[#25D366] hover:text-white"
                    >
                      <MessageCircle className="h-3.5 w-3.5" />
                      Müşteriyle paylaş
                    </button>
                    {canReject(lead) && (
                      <button
                        type="button"
                        onClick={() => rejectLead(lead)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-red-500/30 bg-transparent px-4 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-red-300 uppercase transition-colors hover:bg-red-500/10"
                      >
                        <X className="h-3.5 w-3.5" strokeWidth={2} />
                        Reddet
                      </button>
                    )}
                  </>
                )}
                {live && lead.reservationId && (
                  <a
                    href={`/admin?tab=calendar&res=${lead.reservationId}`}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/[0.06] px-5 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase transition-colors hover:bg-emerald-500/15"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    Takvimde gör
                  </a>
                )}
              </div>
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
