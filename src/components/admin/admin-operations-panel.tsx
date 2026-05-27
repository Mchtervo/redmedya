"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings, CaseStudy } from "@/types/site-settings";
import { getDefaultSiteSettings } from "@/lib/site-settings-defaults";
import { formatPrice } from "@/lib/utils";

export function AdminOperationsPanel() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api/admin/site-settings")
      .then((r) => r.json())
      .then(setSettings)
      .catch(() => setSettings(getDefaultSiteSettings()));
  }, []);

  const save = async () => {
    if (!settings) return;
    setSaving(true);
    const res = await fetch("/api/admin/site-settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setMsg(res.ok ? "Operasyon ayarları kaydedildi." : "Kayıt başarısız");
  };

  if (!settings) return <p className="text-sm text-rm-gray-400">Yükleniyor…</p>;

  const couponRows = Object.entries(settings.couponUsage ?? {});

  return (
    <div className="space-y-10">
      <div className="flex justify-end">
        <Button onClick={save} disabled={saving}>
          {saving ? "Kaydediliyor…" : "Operasyonu kaydet"}
        </Button>
      </div>
      {msg && <p className="text-sm text-rm-champagne">{msg}</p>}

      <section className="rounded-sm border border-white/10 p-5">
        <h2 className="font-display text-xl text-rm-off-white">Kontenjan uyarısı</h2>
        <label className="mt-4 flex items-center gap-2 text-sm text-rm-gray-300">
          <input
            type="checkbox"
            checked={settings.capacity.enabled}
            onChange={(e) =>
              setSettings({
                ...settings,
                capacity: { ...settings.capacity, enabled: e.target.checked },
              })
            }
          />
          Paket özetinde göster
        </label>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input
            type="number"
            placeholder="Kalan tarih"
            value={settings.capacity.datesLeftThisMonth}
            onChange={(e) =>
              setSettings({
                ...settings,
                capacity: {
                  ...settings.capacity,
                  datesLeftThisMonth: Number(e.target.value) || 0,
                },
              })
            }
            className="border-white/15 bg-white/5"
          />
          <Input
            placeholder="bu ay"
            value={settings.capacity.monthLabel ?? ""}
            onChange={(e) =>
              setSettings({
                ...settings,
                capacity: { ...settings.capacity, monthLabel: e.target.value },
              })
            }
            className="border-white/15 bg-white/5"
          />
        </div>
      </section>

      <section className="rounded-sm border border-white/10 p-5">
        <h2 className="font-display text-xl text-rm-off-white">Dolu tarihler</h2>
        <p className="mt-1 text-xs text-rm-gray-500">YYYY-MM-DD, virgülle ayırın</p>
        <Textarea
          className="mt-3 min-h-[80px] border-white/15 bg-white/5 font-mono text-sm"
          value={settings.blockedDates.join(", ")}
          onChange={(e) =>
            setSettings({
              ...settings,
              blockedDates: e.target.value
                .split(/[,\s]+/)
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </section>

      <section className="rounded-sm border border-white/10 p-5">
        <h2 className="font-display text-xl text-rm-off-white">Sezon fiyatı</h2>
        {settings.seasonalRules.map((rule, i) => (
          <div key={rule.id} className="mt-4 grid gap-2 border-t border-white/10 pt-4 sm:grid-cols-4">
            <Input
              value={rule.name}
              onChange={(e) => {
                const seasonalRules = [...settings.seasonalRules];
                seasonalRules[i] = { ...rule, name: e.target.value };
                setSettings({ ...settings, seasonalRules });
              }}
              className="border-white/15 bg-white/5"
            />
            <Input
              type="number"
              placeholder="Baş ay"
              value={rule.startMonth}
              onChange={(e) => {
                const seasonalRules = [...settings.seasonalRules];
                seasonalRules[i] = { ...rule, startMonth: Number(e.target.value) };
                setSettings({ ...settings, seasonalRules });
              }}
              className="border-white/15 bg-white/5"
            />
            <Input
              type="number"
              placeholder="Bit ay"
              value={rule.endMonth}
              onChange={(e) => {
                const seasonalRules = [...settings.seasonalRules];
                seasonalRules[i] = { ...rule, endMonth: Number(e.target.value) };
                setSettings({ ...settings, seasonalRules });
              }}
              className="border-white/15 bg-white/5"
            />
            <Input
              type="number"
              placeholder="% zam"
              value={rule.pricePercent}
              onChange={(e) => {
                const seasonalRules = [...settings.seasonalRules];
                seasonalRules[i] = { ...rule, pricePercent: Number(e.target.value) };
                setSettings({ ...settings, seasonalRules });
              }}
              className="border-white/15 bg-white/5"
            />
          </div>
        ))}
      </section>

      <section className="rounded-sm border border-white/10 p-5">
        <h2 className="font-display text-xl text-rm-off-white">Kupon kullanımı</h2>
        <table className="mt-4 w-full text-left text-sm">
          <thead>
            <tr className="text-rm-gray-500">
              <th className="pb-2">Kod</th>
              <th className="pb-2">Kullanım</th>
            </tr>
          </thead>
          <tbody>
            {couponRows.map(([code, count]) => (
              <tr key={code} className="border-t border-white/10">
                <td className="py-2 text-rm-off-white">{code}</td>
                <td className="py-2 text-rm-champagne">{count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="rounded-sm border border-white/10 p-5">
        <h2 className="font-display text-xl text-rm-off-white">Çift hikayeleri</h2>
        {settings.caseStudies.map((cs, i) => (
          <CaseStudyEditor
            key={cs.id}
            study={cs}
            onChange={(patch) => {
              const caseStudies = [...settings.caseStudies];
              caseStudies[i] = { ...cs, ...patch };
              setSettings({ ...settings, caseStudies });
            }}
          />
        ))}
      </section>

      <section className="rounded-sm border border-white/10 p-5">
        <h2 className="font-display text-xl text-rm-off-white">Sosyal metinler</h2>
        <Textarea
          className="mt-3 border-white/15 bg-white/5"
          value={settings.social.dugunHighlight}
          onChange={(e) =>
            setSettings({
              ...settings,
              social: { ...settings.social, dugunHighlight: e.target.value },
            })
          }
        />
        <Textarea
          className="mt-3 border-white/15 bg-white/5"
          value={settings.social.instagramCta}
          onChange={(e) =>
            setSettings({
              ...settings,
              social: { ...settings.social, instagramCta: e.target.value },
            })
          }
        />
      </section>
    </div>
  );
}

function CaseStudyEditor({
  study,
  onChange,
}: {
  study: CaseStudy;
  onChange: (p: Partial<CaseStudy>) => void;
}) {
  return (
    <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
      <Input
        value={study.couple}
        onChange={(e) => onChange({ couple: e.target.value })}
        className="border-white/15 bg-white/5"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="number"
          placeholder="Ödenecek toplam"
          value={study.total}
          onChange={(e) => onChange({ total: Number(e.target.value) })}
          className="border-white/15 bg-white/5"
        />
        <Input
          type="number"
          placeholder="Ara toplam"
          value={study.subtotal ?? ""}
          onChange={(e) =>
            onChange({ subtotal: Number(e.target.value) || undefined })
          }
          className="border-white/15 bg-white/5"
        />
        <Input
          type="number"
          placeholder="Paket indirimi"
          value={study.packageDiscount ?? ""}
          onChange={(e) =>
            onChange({ packageDiscount: Number(e.target.value) || undefined })
          }
          className="border-white/15 bg-white/5"
        />
        <Input
          type="number"
          placeholder="Kampanya tasarrufu"
          value={study.campaignSavings ?? ""}
          onChange={(e) =>
            onChange({ campaignSavings: Number(e.target.value) || undefined })
          }
          className="border-white/15 bg-white/5"
        />
        <Input
          type="number"
          placeholder="Hediye tasarrufu"
          value={study.giftSavings ?? ""}
          onChange={(e) =>
            onChange({ giftSavings: Number(e.target.value) || undefined })
          }
          className="border-white/15 bg-white/5"
        />
      </div>
      <Textarea
        value={study.items.join("\n")}
        onChange={(e) => onChange({ items: e.target.value.split("\n").filter(Boolean) })}
        className="min-h-[80px] border-white/15 bg-white/5 text-sm"
        placeholder="Her satır bir hizmet"
      />
      <Textarea
        value={study.quote ?? ""}
        onChange={(e) => onChange({ quote: e.target.value })}
        className="border-white/15 bg-white/5 text-sm"
      />
    </div>
  );
}
