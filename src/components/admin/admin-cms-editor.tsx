"use client";

import { useEffect, useState } from "react";
import { Layers, Save, Check, Plus, Trash2, Star, Megaphone, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SiteCmsConfig, ServiceItem, CouponConfig } from "@/types/cms";
import { getDefaultCmsConfig } from "@/lib/cms-defaults";
import { OCCASIONS } from "@/config/occasions";
import { AdminPanelHeader } from "@/components/admin/admin-panel-header";

type Tab = "services" | "bundles" | "coupons" | "campaign";

export function AdminCmsEditor({ embedded }: { embedded?: boolean } = {}) {
  const [config, setConfig] = useState<SiteCmsConfig | null>(null);
  const [tab, setTab] = useState<Tab>("services");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/admin/cms")
      .then((r) => {
        if (!r.ok) throw new Error("auth");
        return r.json();
      })
      .then(setConfig)
      .catch(() => setConfig(getDefaultCmsConfig()));
  }, []);

  const save = async () => {
    if (!config) return;
    setSaving(true);
    setMessage("");
    const res = await fetch("/api/admin/cms", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(config),
    });
    setSaving(false);
    setMessage(
      res.ok
        ? "Kaydedildi — paket sayfası ve site anında bu veriyi kullanır (sayfayı yenileyin veya sekmeye dönün)."
        : "Kayıt başarısız"
    );
  };

  const updateService = (index: number, patch: Partial<ServiceItem>) => {
    if (!config) return;
    const services = [...config.services];
    services[index] = { ...services[index], ...patch };
    setConfig({ ...config, services });
  };

  const addService = () => {
    if (!config) return;
    const id = `hizmet-${Date.now()}`;
    setConfig({
      ...config,
      services: [
        ...config.services,
        {
          id,
          slug: id,
          name: "Yeni Hizmet",
          description: "Açıklama",
          price: 0,
          category: "extra",
          isActive: true,
          sortOrder: config.services.length + 1,
        },
      ],
    });
  };

  const removeService = (index: number) => {
    if (!config || config.services.length <= 1) return;
    setConfig({
      ...config,
      services: config.services.filter((_, i) => i !== index),
    });
  };

  const updateCoupon = (index: number, patch: Partial<CouponConfig>) => {
    if (!config) return;
    const coupons = [...config.coupons];
    coupons[index] = { ...coupons[index], ...patch };
    setConfig({ ...config, coupons });
  };

  const addCoupon = () => {
    if (!config) return;
    setConfig({
      ...config,
      coupons: [
        ...config.coupons,
        {
          id: `c-${Date.now()}`,
          code: "YENI10",
          type: "PERCENTAGE",
          value: 10,
          isActive: true,
        },
      ],
    });
  };

  if (!config) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader eyebrow="Hizmetler" title="İçerik yönetimi" icon={Layers} />
        <div className="h-48 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }

  const tabs: { id: Tab; label: string; icon: typeof Layers }[] = [
    { id: "services", label: "Hizmetler", icon: Layers },
    { id: "bundles", label: "Paket indirimi", icon: Star },
    { id: "coupons", label: "Kuponlar", icon: Ticket },
    { id: "campaign", label: "Kampanya", icon: Megaphone },
  ];

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Hizmetler"
        title="İçerik yönetimi"
        description="Paket oluşturucudaki hizmetler, otomatik indirim kademeleri, kupon kodları ve üst kampanya şeridi buradan güncellenir."
        icon={Layers}
        meta={`${config.services.length} hizmet · ${config.coupons.length} kupon`}
        actions={
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase shadow-[0_6px_22px_rgba(196,160,82,0.3)] transition-all hover:-translate-y-0.5 hover:bg-rm-champagne-light disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Save className="h-3.5 w-3.5" strokeWidth={2.2} />
            {saving ? "Kaydediliyor…" : "Tümünü kaydet"}
          </button>
        }
      />

      {!embedded && null}

      {message && (
        <p className="inline-flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/[0.08] px-4 py-3 text-sm font-medium text-emerald-300">
          <Check className="h-4 w-4" strokeWidth={2.2} />
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-semibold tracking-[0.18em] uppercase transition-all ${
                active
                  ? "border-rm-champagne/40 bg-rm-champagne/15 text-rm-champagne shadow-[inset_0_0_0_1px_rgba(196,160,82,0.15)]"
                  : "border-white/10 bg-white/[0.02] text-rm-gray-400 hover:border-white/20 hover:text-rm-off-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" strokeWidth={1.7} />
              {t.label}
            </button>
          );
        })}
      </div>

      {tab === "services" && (
        <div className="mt-8 space-y-6">
          <Button type="button" variant="outline" size="sm" onClick={addService}>
            + Hizmet ekle
          </Button>
          {config.services.map((s, i) => (
            <div
              key={s.id}
              className="rounded-sm border border-white/10 bg-rm-black-elevated p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-[10px] tracking-wider text-rm-gray-500 uppercase">
                  #{i + 1} · {s.id}
                </span>
                <label className="flex items-center gap-2 text-xs text-rm-gray-400">
                  <input
                    type="checkbox"
                    checked={s.isActive !== false}
                    onChange={(e) => updateService(i, { isActive: e.target.checked })}
                  />
                  Aktif
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
                <select
                  className="rounded-sm border border-white/10 bg-rm-black px-3 py-2 text-sm text-rm-off-white"
                  value={s.category}
                  onChange={(e) =>
                    updateService(i, {
                      category: e.target.value as ServiceItem["category"],
                    })
                  }
                >
                  <option value="foto">Fotoğraf</option>
                  <option value="video">Video</option>
                  <option value="album">Albüm</option>
                  <option value="extra">Ekstra</option>
                </select>
                <select
                  className="rounded-sm border border-white/10 bg-rm-black px-3 py-2 text-sm text-rm-off-white"
                  value={s.occasion ?? ""}
                  onChange={(e) =>
                    updateService(i, {
                      occasion: e.target.value || undefined,
                    })
                  }
                >
                  <option value="">Etkinlik yok</option>
                  {OCCASIONS.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.label}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Hizmet adı"
                  value={s.name}
                  onChange={(e) => updateService(i, { name: e.target.value })}
                />
                <Input
                  type="number"
                  placeholder="Fiyat (₺)"
                  value={s.pricingType === "quantity" ? s.unitPrice ?? 0 : s.price}
                  onChange={(e) => {
                    const v = Number(e.target.value) || 0;
                    if (s.pricingType === "quantity") {
                      updateService(i, { unitPrice: v });
                    } else {
                      updateService(i, { price: v });
                    }
                  }}
                />
              </div>
              <Textarea
                className="mt-3"
                placeholder="Açıklama"
                value={s.description}
                onChange={(e) => updateService(i, { description: e.target.value })}
              />
              <Textarea
                className="mt-3"
                placeholder="Öneri metni (paket oluşturucuda)"
                value={s.recommendation ?? ""}
                onChange={(e) => updateService(i, { recommendation: e.target.value })}
              />
              <Textarea
                className="mt-3"
                placeholder="Çapraz satış ipucu"
                value={s.upsellHint ?? ""}
                onChange={(e) => updateService(i, { upsellHint: e.target.value })}
              />
              <div className="mt-3 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-xs text-rm-gray-400">
                  <input
                    type="checkbox"
                    checked={s.pricingType === "quantity"}
                    onChange={(e) =>
                      updateService(i, {
                        pricingType: e.target.checked ? "quantity" : "fixed",
                        unitPrice: e.target.checked ? 1000 : undefined,
                        maxQuantity: e.target.checked ? 2 : undefined,
                      })
                    }
                  />
                  Adetli fiyat (ör. aile albümü)
                </label>
                <label className="flex items-center gap-2 text-xs text-rm-gray-400">
                  <input
                    type="checkbox"
                    checked={!!s.isPopular}
                    onChange={(e) => updateService(i, { isPopular: e.target.checked })}
                  />
                  Öne çıkan
                </label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => removeService(i)}
              >
                Sil
              </Button>
            </div>
          ))}
        </div>
      )}

      {tab === "bundles" && (
        <div className="mt-8 space-y-4">
          <p className="text-sm text-rm-gray-400">
            Seçilen hizmet sayısına göre otomatik uygulanan yüzde indirimler.
          </p>
          {config.bundleDiscounts.map((b, i) => (
            <div key={i} className="grid gap-3 rounded-sm border border-white/10 p-4 md:grid-cols-3">
              <Input
                type="number"
                placeholder="Min. hizmet"
                value={b.minServices}
                onChange={(e) => {
                  const tiers = [...config.bundleDiscounts];
                  tiers[i] = { ...b, minServices: Number(e.target.value) || 0 };
                  setConfig({ ...config, bundleDiscounts: tiers });
                }}
              />
              <Input
                type="number"
                placeholder="İndirim %"
                value={b.percent}
                onChange={(e) => {
                  const tiers = [...config.bundleDiscounts];
                  tiers[i] = { ...b, percent: Number(e.target.value) || 0 };
                  setConfig({ ...config, bundleDiscounts: tiers });
                }}
              />
              <Input
                placeholder="Mesaj"
                value={b.message}
                onChange={(e) => {
                  const tiers = [...config.bundleDiscounts];
                  tiers[i] = { ...b, message: e.target.value };
                  setConfig({ ...config, bundleDiscounts: tiers });
                }}
              />
            </div>
          ))}
        </div>
      )}

      {tab === "coupons" && (
        <div className="mt-8 space-y-4">
          <Button type="button" variant="outline" size="sm" onClick={addCoupon}>
            + Kupon ekle
          </Button>
          {config.coupons.map((c, i) => (
            <div
              key={c.id}
              className="grid gap-3 rounded-sm border border-white/10 p-4 md:grid-cols-2 lg:grid-cols-4"
            >
              <Input
                value={c.code}
                onChange={(e) => updateCoupon(i, { code: e.target.value.toUpperCase() })}
              />
              <select
                className="rounded-sm border border-white/10 bg-rm-black px-3 py-2 text-sm text-rm-off-white"
                value={c.type}
                onChange={(e) =>
                  updateCoupon(i, { type: e.target.value as CouponConfig["type"] })
                }
              >
                <option value="PERCENTAGE">Yüzde</option>
                <option value="FIXED">Sabit ₺</option>
              </select>
              <Input
                type="number"
                value={c.value}
                onChange={(e) => updateCoupon(i, { value: Number(e.target.value) || 0 })}
              />
              <label className="flex items-center gap-2 text-xs text-rm-gray-400">
                <input
                  type="checkbox"
                  checked={c.isActive}
                  onChange={(e) => updateCoupon(i, { isActive: e.target.checked })}
                />
                Aktif
              </label>
            </div>
          ))}
        </div>
      )}

      {tab === "campaign" && (
        <div className="mt-8 max-w-xl space-y-4">
          <label className="flex items-center gap-2 text-sm text-rm-gray-300">
            <input
              type="checkbox"
              checked={config.campaign.active}
              onChange={(e) =>
                setConfig({
                  ...config,
                  campaign: { ...config.campaign, active: e.target.checked },
                })
              }
            />
            Kampanya şeridi aktif
          </label>
          <Input
            placeholder="Şerit mesajı"
            value={config.campaign.message}
            onChange={(e) =>
              setConfig({
                ...config,
                campaign: { ...config.campaign, message: e.target.value },
              })
            }
          />
          <Input
            placeholder="Buton metni"
            value={config.campaign.ctaLabel}
            onChange={(e) =>
              setConfig({
                ...config,
                campaign: { ...config.campaign, ctaLabel: e.target.value },
              })
            }
          />
          <Input
            placeholder="Buton linki"
            value={config.campaign.ctaHref}
            onChange={(e) =>
              setConfig({
                ...config,
                campaign: { ...config.campaign, ctaHref: e.target.value },
              })
            }
          />
        </div>
      )}
    </div>
  );
}
