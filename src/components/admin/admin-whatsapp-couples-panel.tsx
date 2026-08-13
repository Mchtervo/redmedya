"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  MessageCircle,
  Phone,
  Calendar,
  Search,
  Inbox,
} from "lucide-react";
import type { LeadRecord } from "@/types/site-settings";
import { formatPrice, cn } from "@/lib/utils";
import {
  AdminPanelHeader,
  AdminEmptyState,
} from "@/components/admin/admin-panel-header";
import { formatCustomerName } from "@/lib/customer-name";
import { formatWeddingSchedule } from "@/lib/date-format";
import { formatLeadLineLabel } from "@/lib/service-line";
import { getWhatsAppUrl } from "@/lib/whatsapp";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import {
  isWhatsAppPackageLead,
  leadPackageLabel,
  leadPlatoLabel,
  leadSourceLabel,
} from "@/lib/lead-display";

type Range = "today" | "last_7" | "last_30" | "all";

function startOfTodayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function inRange(iso: string, range: Range): boolean {
  if (range === "all") return true;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  const now = Date.now();
  if (range === "today") return t >= startOfTodayMs();
  if (range === "last_7") return t >= now - 7 * 864e5;
  return t >= now - 30 * 864e5;
}

export function AdminWhatsAppCouplesPanel() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [range, setRange] = useState<Range>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/leads")
      .then((r) => (r.ok ? r.json() : []))
      .then((data: unknown) => {
        setLeads(Array.isArray(data) ? (data as LeadRecord[]) : []);
      })
      .catch(() => setLeads([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminDataSync(load);

  const whatsappLeads = useMemo(
    () => leads.filter(isWhatsAppPackageLead),
    [leads]
  );

  const counts = useMemo(() => {
    const today = whatsappLeads.filter((l) => inRange(l.createdAt, "today")).length;
    const last7 = whatsappLeads.filter((l) => inRange(l.createdAt, "last_7")).length;
    const last30 = whatsappLeads.filter((l) => inRange(l.createdAt, "last_30")).length;
    const packages: Record<string, number> = {};
    for (const l of whatsappLeads.filter((x) => inRange(x.createdAt, range))) {
      const key = leadPackageLabel(l);
      packages[key] = (packages[key] ?? 0) + 1;
    }
    return {
      today,
      last7,
      last30,
      all: whatsappLeads.length,
      packages,
    };
  }, [whatsappLeads, range]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return whatsappLeads
      .filter((l) => inRange(l.createdAt, range))
      .filter((l) => {
        if (!q) return true;
        const hay = [
          formatCustomerName(l.customer),
          l.customer.phone,
          l.customer.note,
          leadPackageLabel(l),
          leadPlatoLabel(l) ?? "",
          ...(l.cart.lineSummary ?? []),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      });
  }, [whatsappLeads, range, query]);

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader
          eyebrow="WhatsApp"
          title="Paket gönderen çiftler"
          icon={MessageCircle}
        />
        <div className="h-28 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
        <div className="h-48 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }

  const rangeTabs: { id: Range; label: string; count: number }[] = [
    { id: "today", label: "Bugün", count: counts.today },
    { id: "last_7", label: "7 gün", count: counts.last7 },
    { id: "last_30", label: "30 gün", count: counts.last30 },
    { id: "all", label: "Tümü", count: counts.all },
  ];

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="WhatsApp"
        title="Paket gönderen çiftler"
        description="WhatsApp’tan paketini gönderen çiftler: isim, telefon, seçilen paket ve doldurdukları bilgiler."
        icon={MessageCircle}
        meta={`${visible.length} çift bu filtrede · toplam ${counts.all} gönderim`}
        actions={
          <a
            href="/admin?tab=leads"
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-rm-off-white uppercase transition-colors hover:border-rm-champagne/40 hover:text-rm-champagne"
          >
            <Inbox className="h-3.5 w-3.5" />
            Tekliflere git
          </a>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {rangeTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setRange(t.id)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-left transition-colors sm:px-4",
              range === t.id
                ? "border-rm-champagne/40 bg-rm-champagne/[0.08]"
                : "border-white/8 bg-rm-black-elevated/50 hover:border-white/20"
            )}
          >
            <p className="text-[10px] font-semibold tracking-[0.18em] text-rm-gray-500 uppercase">
              {t.label}
            </p>
            <p className="mt-1 font-editorial text-2xl tabular-nums text-rm-off-white">
              {t.count}
            </p>
          </button>
        ))}
      </div>

      {Object.keys(counts.packages).length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {Object.entries(counts.packages).map(([name, n]) => (
            <li
              key={name}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] text-rm-gray-300"
            >
              <span className="text-rm-off-white">{name}</span>
              <span className="ml-1.5 tabular-nums text-rm-champagne">{n}</span>
            </li>
          ))}
        </ul>
      )}

      <label className="relative block">
        <span className="sr-only">Çift ara</span>
        <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-rm-gray-500" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="İsim, telefon veya paket ara"
          className="h-11 w-full rounded-xl border border-white/10 bg-white/[0.03] pr-3 pl-10 text-sm text-rm-off-white outline-none placeholder:text-rm-gray-600 focus:border-rm-champagne/40"
        />
      </label>

      {visible.length === 0 ? (
        <AdminEmptyState
          icon={MessageCircle}
          title="Bu aralıkta gönderim yok"
          description="Çift paketini WhatsApp’tan gönderince burada isim, paket ve iletişim bilgisi görünür."
        />
      ) : (
        <ul className="space-y-3">
          {visible.map((lead) => {
            const name = formatCustomerName(lead.customer) || "İsimsiz";
            const pkg = leadPackageLabel(lead);
            const plato = leadPlatoLabel(lead);
            const open = openId === lead.id;
            const dateLabel = formatWeddingSchedule(
              lead.customer.weddingDate,
              lead.customer.weddingTime
            );
            const lines =
              lead.lineDetails ??
              lead.cart.lineSummary.map((label) => ({ label, price: 0 }));
            return (
              <li key={lead.id}>
                <article className="rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-4 sm:p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-editorial text-xl text-rm-off-white sm:text-2xl">
                        {name}
                      </p>
                      <p className="mt-1 text-sm text-rm-champagne">{pkg}</p>
                      {plato ? (
                        <p className="mt-0.5 text-xs text-rm-gray-500">
                          Plato: {plato}
                        </p>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="font-editorial text-2xl tabular-nums text-rm-champagne">
                        {formatPrice(lead.cart.total)}
                      </p>
                      <p className="mt-1 text-[10px] tracking-[0.16em] text-rm-gray-600 uppercase">
                        {new Date(lead.createdAt).toLocaleString("tr-TR")}
                      </p>
                    </div>
                  </div>

                  <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                    <div className="flex items-center gap-2 text-rm-gray-300">
                      <Phone className="h-3.5 w-3.5 text-rm-champagne/70" />
                      <dt className="sr-only">Telefon</dt>
                      <dd>{lead.customer.phone || "—"}</dd>
                    </div>
                    <div className="flex items-center gap-2 text-rm-gray-300">
                      <Calendar className="h-3.5 w-3.5 text-rm-gray-500" />
                      <dt className="sr-only">Düğün tarihi</dt>
                      <dd>{dateLabel || "Tarih yok"}</dd>
                    </div>
                  </dl>

                  <p className="mt-3 text-[10px] tracking-[0.16em] text-rm-gray-600 uppercase">
                    {leadSourceLabel(lead.source)}
                    {lead.customer.firstName ? " · Ad var" : " · Ad yok"}
                    {lead.customer.lastName ? " · Soyad var" : ""}
                    {lead.customer.phone ? " · Telefon var" : " · Telefon yok"}
                    {lead.customer.weddingDate ? " · Tarih var" : " · Tarih yok"}
                    {lead.customer.note?.trim() ? " · Not var" : ""}
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setOpenId(open ? null : lead.id)}
                      aria-expanded={open}
                      className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-rm-off-white uppercase hover:border-rm-champagne/40"
                    >
                      {open ? "Gizle" : "Paket detayı"}
                    </button>
                    {lead.customer.phone ? (
                      <a
                        href={getWhatsAppUrl(
                          `Merhaba ${name}, REDMEDYA paketiniz için yazıyorum.`,
                          lead.customer.phone
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-full border border-[#25D366]/40 bg-[#25D366]/10 px-4 py-2 text-[11px] font-semibold tracking-[0.16em] text-[#25D366] uppercase hover:bg-[#25D366] hover:text-white"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                        WhatsApp
                      </a>
                    ) : null}
                  </div>

                  {open ? (
                    <div className="mt-4 border-t border-white/8 pt-4">
                      {lead.customer.note?.trim() ? (
                        <p className="mb-3 text-sm text-rm-gray-300">
                          <span className="text-rm-gray-500">Not: </span>
                          {lead.customer.note}
                        </p>
                      ) : null}
                      <ul className="grid gap-1.5 text-sm text-rm-gray-300 sm:grid-cols-2">
                        {lines.map((line) => (
                          <li
                            key={formatLeadLineLabel(line)}
                            className="rounded-lg bg-white/[0.02] px-3 py-2 text-rm-off-white"
                          >
                            {formatLeadLineLabel(line)}
                            {"price" in line && line.price > 0 ? (
                              <span className="ml-2 text-xs text-rm-gray-500">
                                {formatPrice(line.price)}
                              </span>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
