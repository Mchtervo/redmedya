"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Database,
  Download,
  RefreshCw,
  FileJson,
  Inbox,
  ShoppingBag,
  CalendarCheck2,
  Contact,
  Settings2,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  AdminPanelHeader,
  AdminSection,
  AdminEmptyState,
} from "@/components/admin/admin-panel-header";

type ExportPayload = {
  exportedAt: string;
  cms: { updatedAt?: string; services: unknown[] };
  siteSettings: { updatedAt?: string };
  leads: unknown[];
  reservations: unknown[];
  rehber: unknown[];
  packageDrafts: unknown[];
  insights: {
    totals: Record<string, number>;
    serviceStats: { label: string; count: number }[];
  };
};

export function AdminDataPanel() {
  const [data, setData] = useState<ExportPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    setError("");
    fetch("/api/admin/export")
      .then((r) => {
        if (!r.ok) throw new Error("auth");
        return r.json();
      })
      .then(setData)
      .catch(() => {
        setData(null);
        setError("Veri alınamadı. Oturum açık mı kontrol edin.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const downloadJson = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `redmedya-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader eyebrow="Veriler" title="Dışa aktar" icon={Database} />
        <div className="h-48 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader eyebrow="Veriler" title="Dışa aktar" icon={Database} />
        <AdminEmptyState
          icon={Database}
          title="Veri alınamadı"
          description={error}
        />
      </div>
    );
  }
  if (!data) return null;

  const cards = [
    {
      label: "CMS hizmet",
      value: data.cms.services?.length ?? 0,
      sub: data.cms.updatedAt
        ? new Date(data.cms.updatedAt).toLocaleString("tr-TR")
        : "—",
      icon: Layers,
    },
    {
      label: "Teklif (lead)",
      value: data.leads.length,
      sub: "WhatsApp ile gelen",
      icon: Inbox,
    },
    {
      label: "Yarım sepet",
      value: data.packageDrafts.length,
      sub: "Teklif yapmayan dahil",
      icon: ShoppingBag,
    },
    {
      label: "Rezervasyon",
      value: data.reservations.length,
      sub: "Onaylı",
      icon: CalendarCheck2,
    },
    {
      label: "Rehber",
      value: data.rehber.length,
      sub: "Kişi kaydı",
      icon: Contact,
    },
    {
      label: "Site ayarları",
      value: 1,
      sub: data.siteSettings.updatedAt
        ? new Date(data.siteSettings.updatedAt).toLocaleString("tr-TR")
        : "—",
      icon: Settings2,
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Veriler"
        title="Dışa aktar"
        description="CMS, ayarlar, lead, sepet, rezervasyon ve rehber kayıtlarının tek seferlik tam yedeğini buradan JSON olarak indirebilirsiniz."
        icon={Database}
        meta={`Son çekim: ${new Date(data.exportedAt).toLocaleString("tr-TR")}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold tracking-[0.18em] text-rm-off-white uppercase transition-colors hover:border-rm-champagne/40 hover:bg-rm-champagne/10 hover:text-rm-champagne"
            >
              <RefreshCw className="h-3.5 w-3.5" strokeWidth={1.8} />
              Yenile
            </button>
            <button
              type="button"
              onClick={downloadJson}
              className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase shadow-[0_6px_22px_rgba(196,160,82,0.3)] transition-all hover:-translate-y-0.5 hover:bg-rm-champagne-light"
            >
              <Download className="h-3.5 w-3.5" strokeWidth={2.2} />
              JSON indir
            </button>
          </div>
        }
      />

      <div className="rounded-2xl border border-rm-champagne/20 bg-rm-champagne/[0.04] p-4 text-sm text-rm-gray-300 sm:p-5">
        <p className="flex items-center gap-2 font-medium text-rm-off-white">
          <FileJson className="h-4 w-4 text-rm-champagne" strokeWidth={1.6} />
          Admin → site entegrasyonu
        </p>
        <ul className="mt-3 space-y-1.5 text-rm-gray-400">
          <li className="flex items-start gap-2">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-rm-champagne/60" />
            <span>
              <strong className="text-rm-champagne">Hizmetler & kupon</strong> kaydı{" "}
              <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-xs">data/cms.json</code>{" "}
              dosyasına yazılır; paket sayfası ve fiyatlar buradan okunur.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-rm-champagne/60" />
            <span>
              <strong className="text-rm-champagne">Kontenjan & sezon</strong>{" "}
              <code className="rounded bg-white/[0.04] px-1.5 py-0.5 text-xs">data/site-settings.json</code>{" "}
              ile ana sayfa ve tarih seçici beslenir.
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-2 inline-block h-1 w-1 shrink-0 rounded-full bg-rm-champagne/60" />
            <span>Sepet, teklif, rezervasyon ve rehber verileri özet panelinde veya JSON dosyasında görülebilir.</span>
          </li>
        </ul>
      </div>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.label}
              className="rounded-2xl border border-white/8 bg-rm-black-elevated/60 p-3.5 backdrop-blur-sm transition-all hover:border-rm-champagne/25 hover:bg-rm-black-elevated sm:p-5"
            >
              <div className="flex items-start justify-between">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-rm-champagne sm:h-9 sm:w-9">
                  <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={1.6} />
                </span>
                <p className="font-editorial text-2xl tabular-nums text-rm-off-white sm:text-3xl">
                  {c.value}
                </p>
              </div>
              <p className="mt-3 text-[9px] font-semibold tracking-[0.2em] text-rm-gray-500 uppercase sm:mt-4 sm:text-[10px] sm:tracking-[0.22em]">
                {c.label}
              </p>
              <p className="mt-0.5 truncate text-[11px] text-rm-gray-600">{c.sub}</p>
            </div>
          );
        })}
      </div>

      {data.insights?.serviceStats?.length > 0 && (
        <AdminSection
          title="Popüler hizmetler"
          description="Sepet & istatistik sekmesindeki tablo ile aynı kaynak."
          icon={Sparkles}
        >
          <ul className="max-h-72 space-y-1 overflow-y-auto pr-1 text-sm text-rm-gray-400">
            {data.insights.serviceStats.slice(0, 15).map((s) => (
              <li
                key={s.label}
                className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-white/[0.02]"
              >
                <span className="text-rm-off-white">{s.label}</span>
                <span className="rounded-full bg-rm-champagne/10 px-2.5 py-0.5 text-xs font-bold tabular-nums text-rm-champagne">
                  {s.count}
                </span>
              </li>
            ))}
          </ul>
        </AdminSection>
      )}
    </div>
  );
}
