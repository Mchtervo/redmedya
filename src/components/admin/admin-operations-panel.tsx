"use client";

import { useEffect, useState } from "react";
import {
  Settings2,
  Save,
  AlarmClock,
  CalendarX,
  Sun,
  Ticket,
  Heart,
  Megaphone,
  Check,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SiteSettings, CaseStudy } from "@/types/site-settings";
import { getDefaultSiteSettings } from "@/lib/site-settings-defaults";
import {
  AdminPanelHeader,
  AdminSection,
} from "@/components/admin/admin-panel-header";

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

  if (!settings) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader
          eyebrow="Site ayarları"
          title="Operasyon"
          icon={Settings2}
        />
        <div className="h-48 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }

  const couponRows = Object.entries(settings.couponUsage ?? {});

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Site ayarları"
        title="Operasyon"
        description="Kontenjan, sezon zammı, dolu tarihler, kuponlar ve ana sayfadaki sosyal metinleri buradan yönetin. Değişiklikler kaydedildikten sonra anında siteye yansır."
        icon={Settings2}
        actions={
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase shadow-[0_6px_22px_rgba(196,160,82,0.3)] transition-all hover:-translate-y-0.5 hover:bg-rm-champagne-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2.2} />
            {saving ? "Kaydediliyor…" : "Kaydet"}
          </button>
        }
      />

      {msg && (
        <p className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-sm font-medium text-emerald-300">
          <Check className="h-4 w-4" strokeWidth={2.2} />
          {msg}
        </p>
      )}

      <AdminSection
        title="Kontenjan uyarısı"
        description="Paket özetinde 'bu ay kalan tarih' satırı."
        icon={AlarmClock}
      >
        <label className="flex items-center gap-2.5 text-sm text-rm-gray-300">
          <input
            type="checkbox"
            checked={settings.capacity.enabled}
            onChange={(e) =>
              setSettings({
                ...settings,
                capacity: { ...settings.capacity, enabled: e.target.checked },
              })
            }
            className="h-4 w-4 rounded border-white/15 bg-white/[0.03] text-rm-champagne accent-rm-champagne"
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
            className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
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
            className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
          />
        </div>
      </AdminSection>

      <AdminSection
        title="Dolu tarihler"
        description="YYYY-MM-DD formatı, virgülle ayırın. Bu günler tarih seçicide kapalı görünür."
        icon={CalendarX}
      >
        <Textarea
          className="min-h-[80px] rounded-xl border-white/10 bg-white/[0.03] font-mono text-sm"
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
      </AdminSection>

      <AdminSection
        title="Sezon fiyatı"
        description="Ay aralığına göre yüzdesel zam (örn. yaz sezonu +%15)."
        icon={Sun}
      >
        <div className="space-y-3">
          {settings.seasonalRules.map((rule, i) => (
            <div
              key={rule.id}
              className="grid gap-2 rounded-xl border border-white/8 bg-white/[0.02] p-3 sm:grid-cols-4"
            >
              <Input
                value={rule.name}
                placeholder="Sezon adı"
                onChange={(e) => {
                  const seasonalRules = [...settings.seasonalRules];
                  seasonalRules[i] = { ...rule, name: e.target.value };
                  setSettings({ ...settings, seasonalRules });
                }}
                className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
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
                className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
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
                className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
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
                className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
              />
            </div>
          ))}
        </div>
      </AdminSection>

      <AdminSection
        title="Kupon kullanımı"
        description="Şu ana kadar kaç kez kullanıldı."
        icon={Ticket}
      >
        {couponRows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-6 text-center text-sm text-rm-gray-500">
            Henüz hiç kupon kullanılmamış.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-white/8">
            <table className="w-full min-w-[320px] text-left text-sm">
              <thead>
                <tr className="bg-white/[0.03] text-[10px] tracking-[0.2em] text-rm-gray-500 uppercase">
                  <th className="px-4 py-2.5">Kod</th>
                  <th className="px-4 py-2.5 text-right">Kullanım</th>
                </tr>
              </thead>
              <tbody>
                {couponRows.map(([code, count]) => (
                  <tr key={code} className="border-t border-white/5">
                    <td className="px-4 py-2.5 font-medium text-rm-off-white">
                      {code}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold tabular-nums text-rm-champagne">
                      {count}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminSection>

      <AdminSection
        title="Çift hikayeleri"
        description="Ana sayfada gösterilen örnek paket hesapları."
        icon={Heart}
      >
        <div className="space-y-3">
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
        </div>
      </AdminSection>

      <AdminSection
        title="Sosyal metinler"
        description="Düğün.com vurgusu ve Instagram CTA."
        icon={Megaphone}
      >
        <Textarea
          className="rounded-xl border-white/10 bg-white/[0.03]"
          placeholder="Düğün.com vurgusu"
          value={settings.social.dugunHighlight}
          onChange={(e) =>
            setSettings({
              ...settings,
              social: { ...settings.social, dugunHighlight: e.target.value },
            })
          }
        />
        <Textarea
          className="mt-3 rounded-xl border-white/10 bg-white/[0.03]"
          placeholder="Instagram CTA"
          value={settings.social.instagramCta}
          onChange={(e) =>
            setSettings({
              ...settings,
              social: { ...settings.social, instagramCta: e.target.value },
            })
          }
        />
      </AdminSection>

      <div className="sticky bottom-4 z-10 flex justify-end">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-6 py-3 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase shadow-[0_10px_35px_rgba(196,160,82,0.4)] transition-all hover:-translate-y-0.5 hover:bg-rm-champagne-light disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Save className="h-3.5 w-3.5" strokeWidth={2.2} />
          {saving ? "Kaydediliyor…" : "Tümünü kaydet"}
        </button>
      </div>
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
        className="rounded-lg border-white/10 bg-white/[0.03]"
      />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          type="number"
          placeholder="Ödenecek toplam"
          value={study.total}
          onChange={(e) => onChange({ total: Number(e.target.value) })}
          className="rounded-lg border-white/10 bg-white/[0.03]"
        />
        <Input
          type="number"
          placeholder="Ara toplam"
          value={study.subtotal ?? ""}
          onChange={(e) =>
            onChange({ subtotal: Number(e.target.value) || undefined })
          }
          className="rounded-lg border-white/10 bg-white/[0.03]"
        />
        <Input
          type="number"
          placeholder="Paket indirimi"
          value={study.packageDiscount ?? ""}
          onChange={(e) =>
            onChange({ packageDiscount: Number(e.target.value) || undefined })
          }
          className="rounded-lg border-white/10 bg-white/[0.03]"
        />
        <Input
          type="number"
          placeholder="Kampanya tasarrufu"
          value={study.campaignSavings ?? ""}
          onChange={(e) =>
            onChange({ campaignSavings: Number(e.target.value) || undefined })
          }
          className="rounded-lg border-white/10 bg-white/[0.03]"
        />
        <Input
          type="number"
          placeholder="Hediye tasarrufu"
          value={study.giftSavings ?? ""}
          onChange={(e) =>
            onChange({ giftSavings: Number(e.target.value) || undefined })
          }
          className="rounded-lg border-white/10 bg-white/[0.03]"
        />
      </div>
      <Textarea
        value={study.items.join("\n")}
        onChange={(e) => onChange({ items: e.target.value.split("\n").filter(Boolean) })}
        className="min-h-[80px] rounded-lg border-white/10 bg-white/[0.03] text-sm"
        placeholder="Her satır bir hizmet"
      />
      <Textarea
        value={study.quote ?? ""}
        onChange={(e) => onChange({ quote: e.target.value })}
        className="rounded-lg border-white/10 bg-white/[0.03] text-sm"
      />
    </div>
  );
}

