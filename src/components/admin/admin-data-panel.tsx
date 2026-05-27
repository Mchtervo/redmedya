"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

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

  if (loading) return <p className="text-sm text-rm-gray-400">Tüm veriler yükleniyor…</p>;
  if (error) return <p className="text-sm text-red-400">{error}</p>;
  if (!data) return null;

  const cards = [
    {
      label: "CMS hizmet",
      value: data.cms.services?.length ?? 0,
      sub: data.cms.updatedAt
        ? new Date(data.cms.updatedAt).toLocaleString("tr-TR")
        : "—",
    },
    {
      label: "Teklif (lead)",
      value: data.leads.length,
      sub: "WhatsApp ile gelen",
    },
    {
      label: "Yarım sepet",
      value: data.packageDrafts.length,
      sub: "Teklif yapmayan dahil",
    },
    {
      label: "Rezervasyon",
      value: data.reservations.length,
      sub: "Onaylı",
    },
    {
      label: "Rehber",
      value: data.rehber.length,
      sub: "Kişi kaydı",
    },
    {
      label: "Site ayarları",
      value: "✓",
      sub: data.siteSettings.updatedAt
        ? new Date(data.siteSettings.updatedAt).toLocaleString("tr-TR")
        : "—",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-sm border border-rm-champagne/20 bg-rm-champagne/5 p-4 text-sm text-rm-gray-300">
        <p className="font-medium text-rm-off-white">Admin → site entegrasyonu</p>
        <ul className="mt-2 list-inside list-disc space-y-1 text-rm-gray-400">
          <li>
            <strong className="text-rm-champagne">Hizmetler & kupon</strong> kaydı{" "}
            <code className="text-xs">data/cms.json</code> dosyasına yazılır; paket
            sayfası ve fiyatlar buradan okunur.
          </li>
          <li>
            <strong className="text-rm-champagne">Kontenjan & sezon</strong>{" "}
            <code className="text-xs">data/site-settings.json</code> — ana sayfa ve
            tarih seçici.
          </li>
          <li>
            Sepet, teklif, rezervasyon ve rehber verileri aşağıdaki özetten veya
            JSON indirmeden görülebilir.
          </li>
        </ul>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={load} variant="outline" size="sm">
          Verileri yenile
        </Button>
        <Button type="button" onClick={downloadJson} size="sm">
          Tüm veriyi JSON indir
        </Button>
      </div>

      <p className="text-xs text-rm-gray-500">
        Son çekim: {new Date(data.exportedAt).toLocaleString("tr-TR")}
      </p>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="rounded-sm border border-white/10 bg-rm-black-elevated p-4"
          >
            <p className="text-2xl font-display text-rm-champagne">{c.value}</p>
            <p className="mt-1 text-xs tracking-wider text-rm-gray-500 uppercase">
              {c.label}
            </p>
            <p className="mt-1 text-[10px] text-rm-gray-600">{c.sub}</p>
          </div>
        ))}
      </div>

      {data.insights?.serviceStats?.length > 0 && (
        <section>
          <h3 className="font-display text-lg text-rm-off-white">
            Popüler hizmetler (sepet verisi)
          </h3>
          <p className="mt-1 text-xs text-rm-gray-500">
            Sepet & istatistik sekmesindeki tablo ile aynı kaynak.
          </p>
          <ul className="mt-3 max-h-48 overflow-y-auto text-sm text-rm-gray-400">
            {data.insights.serviceStats.slice(0, 15).map((s) => (
              <li key={s.label} className="flex justify-between border-b border-white/5 py-1">
                <span>{s.label}</span>
                <span className="text-rm-champagne">{s.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
