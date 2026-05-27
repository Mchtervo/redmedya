"use client";

import { Plus, RotateCcw, Trash2 } from "lucide-react";
import type { LeadLineDetail } from "@/types/reservations";
import type { CustomerInfo } from "@/stores/package-store";
import { formatPrice, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  computePayableTotal,
  sumActiveServices,
  inferBundleDiscountFromTotal,
  bundleDiscountPercent,
  bundleDiscountFromPercent,
} from "@/lib/reservation-totals";
import { AdminServiceCatalog } from "@/components/admin/admin-service-catalog";
import { normalizeCustomerName } from "@/lib/customer-name";
import {
  AILE_ALBUM_ID,
  BUYUK_ALBUM_ID,
  buyukAlbumFullLineLabel,
  buyukAlbumPageOptionLabel,
} from "@/config/albums";
import {
  buyukAlbumPriceFromBase,
  formatLeadLineLabel,
  resolveLinePages,
  resolveLineQuantity,
} from "@/lib/service-line";

export type ReservationEditorState = {
  customer: CustomerInfo;
  services: LeadLineDetail[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  total: number;
  depositAmount: number;
  shootingLocation: string;
  shootingNote: string;
  studioOwned: boolean;
};

export function reservationToEditorState(r: {
  customer: CustomerInfo;
  services: LeadLineDetail[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  total: number;
  depositAmount: number;
  shootingLocation?: string;
  shootingNote?: string;
  studioOwned?: boolean;
}): ReservationEditorState {
  return {
    customer: { ...r.customer },
    services: r.services.map((s) => ({ ...s })),
    subtotal: r.subtotal,
    bundleDiscount: r.bundleDiscount,
    couponDiscount: r.couponDiscount,
    total: r.total,
    depositAmount: r.depositAmount,
    shootingLocation: r.shootingLocation ?? "",
    shootingNote: r.shootingNote ?? "",
    studioOwned: Boolean(r.studioOwned),
  };
}

type ReservationEditorFormProps = {
  form: ReservationEditorState;
  onChange: (next: ReservationEditorState) => void;
};

export function ReservationEditorForm({
  form,
  onChange,
}: ReservationEditorFormProps) {
  const set = (patch: Partial<ReservationEditorState>) =>
    onChange({ ...form, ...patch });

  const setCustomer = (patch: Partial<CustomerInfo>) =>
    onChange({ ...form, customer: { ...form.customer, ...patch } });

  const recalcTotals = (
    services: LeadLineDetail[],
    opts?: { keepPackageTotal?: boolean; totalOverride?: number }
  ) => {
    const subtotal = sumActiveServices(services);
    const totalTarget = opts?.totalOverride ?? form.total;
    let bundleDiscount = form.bundleDiscount;

    if (
      opts?.keepPackageTotal &&
      subtotal > 0 &&
      totalTarget > 0 &&
      totalTarget < subtotal
    ) {
      bundleDiscount = inferBundleDiscountFromTotal(
        subtotal,
        totalTarget,
        form.couponDiscount
      );
    } else if (!opts?.keepPackageTotal) {
      bundleDiscount = form.bundleDiscount;
    }

    const total = computePayableTotal(
      subtotal,
      bundleDiscount,
      form.couponDiscount
    );

    onChange({ ...form, services, subtotal, bundleDiscount, total });
  };

  const updateService = (index: number, patch: Partial<LeadLineDetail>) => {
    const services = [...form.services];
    const cur = services[index];
    let next: LeadLineDetail = { ...cur, ...patch };

    if (patch.isGift === true) {
      const listPrice =
        cur.listPrice ?? (Number(cur.price) > 0 ? Number(cur.price) : undefined);
      next = {
        ...next,
        excluded: false,
        isGift: true,
        listPrice,
        price: 0,
      };
    } else if (patch.isGift === false) {
      next = {
        ...next,
        isGift: false,
        price: Number(cur.listPrice ?? cur.price) || 0,
      };
    }
    if (patch.excluded === true) {
      next = { ...next, isGift: false, excluded: true };
    }

    services[index] = next;
    recalcTotals(services, { keepPackageTotal: true });
  };

  const removeService = (index: number) => {
    const services = form.services.filter((_, i) => i !== index);
    recalcTotals(services.length ? services : [{ label: "", price: 0 }], {
      keepPackageTotal: true,
    });
  };

  const addService = (line?: LeadLineDetail) => {
    if (line?.serviceId === AILE_ALBUM_ID) {
      const idx = form.services.findIndex(
        (s) => s.serviceId === AILE_ALBUM_ID && !s.excluded
      );
      if (idx >= 0) {
        updateService(idx, line);
        return;
      }
    }

    if (line?.serviceId === BUYUK_ALBUM_ID) {
      const idx = form.services.findIndex(
        (s) => s.serviceId === BUYUK_ALBUM_ID && !s.excluded
      );
      if (idx >= 0) {
        updateService(idx, line);
        return;
      }
    }

    const entry: LeadLineDetail = line ?? { label: "", price: 0 };
    const hasOnlyEmpty =
      form.services.length === 1 &&
      !form.services[0].label.trim() &&
      form.services[0].price === 0;
    const services = hasOnlyEmpty ? [entry] : [...form.services, entry];
    recalcTotals(services, { keepPackageTotal: Boolean(line) });
  };

  const addedServiceIds = form.services
    .filter((s) => s.serviceId && !s.excluded)
    .map((s) => s.serviceId!);

  const syncSubtotalFromServices = () => {
    recalcTotals(form.services, {
      keepPackageTotal:
        form.total > 0 && form.total < sumActiveServices(form.services),
    });
  };

  const syncTotalFromBreakdown = () => {
    const total = computePayableTotal(
      form.subtotal,
      form.bundleDiscount,
      form.couponDiscount
    );
    onChange({ ...form, total });
  };

  const applyPercentDiscount = (percent: number) => {
    const bundleDiscount = bundleDiscountFromPercent(form.subtotal, percent);
    const total = computePayableTotal(
      form.subtotal,
      bundleDiscount,
      form.couponDiscount
    );
    onChange({ ...form, bundleDiscount, total });
  };

  const impliedPercent = bundleDiscountPercent(
    form.subtotal,
    form.bundleDiscount
  );

  const remaining = Math.max(0, form.total - form.depositAmount);

  return (
    <div className="space-y-5">
      <div className="grid gap-2 sm:grid-cols-2">
        <Input
          placeholder="Ad"
          value={form.customer.firstName}
          onChange={(e) => setCustomer({ firstName: e.target.value })}
          className="border-white/15 bg-white/5"
        />
        <Input
          placeholder="Soyad (tek isim buraya da yazılabilir)"
          value={form.customer.lastName}
          onChange={(e) => setCustomer({ lastName: e.target.value })}
          className="border-white/15 bg-white/5"
        />
        <Input
          placeholder="Telefon (opsiyonel)"
          value={form.customer.phone}
          onChange={(e) => setCustomer({ phone: e.target.value })}
          className="border-white/15 bg-white/5 sm:col-span-2"
        />
        <Input
          type="date"
          value={form.customer.weddingDate}
          onChange={(e) => setCustomer({ weddingDate: e.target.value })}
          className="border-white/15 bg-white/5"
        />
        <label className="block">
          <span className="mb-1 block text-[10px] font-medium text-rm-gray-500">
            Düğün saati
          </span>
          <Input
            type="time"
            value={form.customer.weddingTime ?? ""}
            onChange={(e) => setCustomer({ weddingTime: e.target.value })}
            className="border-white/15 bg-white/5 text-rm-off-white [color-scheme:dark]"
          />
        </label>
        <Input
          placeholder="Müşteri notu (WhatsApp)"
          value={form.customer.note}
          onChange={(e) => setCustomer({ note: e.target.value })}
          className="border-white/15 bg-white/5 sm:col-span-2"
        />
      </div>

      {form.customer.weddingTime && form.services.length > 0 && (
        <button
          type="button"
          onClick={() => {
            const t = form.customer.weddingTime!;
            onChange({
              ...form,
              services: form.services.map((s) => ({ ...s, shootingTime: t })),
            });
          }}
          className="text-xs text-rm-champagne underline"
        >
          Düğün saatini tüm hizmetlere uygula
        </button>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 sm:col-span-2">
          <input
            type="checkbox"
            checked={form.studioOwned}
            onChange={(e) => set({ studioOwned: e.target.checked })}
            className="rounded border-white/20"
          />
          <span className="text-sm text-rm-off-white">Plato bize ait</span>
        </label>
        <Input
          placeholder="Çekim alanı / salon adresi"
          value={form.shootingLocation}
          onChange={(e) => set({ shootingLocation: e.target.value })}
          className="border-white/15 bg-white/5 sm:col-span-2"
        />
        <Textarea
          placeholder="Ekip notu (çekim günü, özel istekler…)"
          value={form.shootingNote}
          onChange={(e) => set({ shootingNote: e.target.value })}
          className="min-h-[72px] border-white/15 bg-white/5 sm:col-span-2"
        />
      </div>

      <div>
        <AdminServiceCatalog
          onAdd={(line) => addService(line)}
          addedServiceIds={addedServiceIds}
        />

        <div className="mt-4 flex items-center justify-between">
          <p className="text-[10px] font-bold tracking-wider text-rm-gray-500 uppercase">
            Seçilen hizmetler
          </p>
          <button
            type="button"
            onClick={() => addService()}
            className="flex items-center gap-1 text-xs text-rm-champagne"
          >
            <Plus className="h-3 w-3" /> Özel satır
          </button>
        </div>

        <ul className="mt-2 space-y-3">
          {form.services.map((s, i) => (
            <li
              key={i}
              className={cn(
                "rounded-lg border border-white/10 bg-white/[0.02] p-3",
                s.excluded && "opacity-60"
              )}
            >
              <input
                value={s.label}
                onChange={(e) => updateService(i, { label: e.target.value })}
                placeholder="Hizmet adı"
                className="mb-2 w-full rounded border border-white/10 bg-white/5 px-2 py-1.5 text-sm"
              />
              <div className="grid gap-2 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-1 block text-[10px] text-rm-gray-500">
                    Çekim yeri
                  </span>
                  <Input
                    placeholder="Salon / adres"
                    value={s.shootingLocation ?? ""}
                    onChange={(e) =>
                      updateService(i, { shootingLocation: e.target.value })
                    }
                    className="h-9 border-white/10 bg-white/5 text-xs"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] text-rm-gray-500">
                    Saat
                  </span>
                  <Input
                    type="time"
                    value={s.shootingTime ?? ""}
                    onChange={(e) =>
                      updateService(i, { shootingTime: e.target.value })
                    }
                    className="h-9 border-white/10 bg-white/5 text-xs text-rm-off-white [color-scheme:dark]"
                  />
                </label>
              </div>
              {s.serviceId === BUYUK_ALBUM_ID && (
                <label className="mt-2 block">
                  <span className="mb-1 block text-[10px] text-rm-gray-500">
                    Yaprak · sayfa
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {([10, 20] as const).map((pages) => {
                      const base =
                        s.listPrice ??
                        ((resolveLinePages(s) === 20
                          ? Math.round(s.price / 1.5)
                          : s.price) || 2500);
                      const price = buyukAlbumPriceFromBase(base, pages);
                      const selected = resolveLinePages(s) === pages;
                      return (
                        <button
                          key={pages}
                          type="button"
                          onClick={() =>
                            updateService(i, {
                              selectedPages: pages,
                              listPrice: base,
                              price,
                              label: buyukAlbumFullLineLabel(pages),
                            })
                          }
                          className={cn(
                            "rounded border px-2 py-2 text-left text-xs transition-colors",
                            selected
                              ? "border-rm-champagne/50 bg-rm-champagne/15 text-rm-off-white"
                              : "border-white/10 bg-white/5 text-rm-gray-400 hover:border-white/20"
                          )}
                        >
                          <span className="font-medium leading-snug">
                            {buyukAlbumPageOptionLabel(pages)}
                          </span>
                          {pages === 20 && (
                            <span className="ml-1 text-[10px] text-rm-champagne">
                              +50%
                            </span>
                          )}
                          <p className="mt-0.5 tabular-nums text-rm-champagne">
                            {formatPrice(price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </label>
              )}
              {s.serviceId === AILE_ALBUM_ID && (
                <label className="mt-2 block">
                  <span className="mb-1 block text-[10px] text-rm-gray-500">
                    Aile albümü adedi
                  </span>
                  <select
                    value={resolveLineQuantity(s) || 1}
                    onChange={(e) => {
                      const qty = Number(e.target.value) || 1;
                      const unit =
                        s.unitPrice ??
                        (resolveLineQuantity(s) > 0
                          ? s.price / resolveLineQuantity(s)
                          : 1000);
                      updateService(i, {
                        quantity: qty,
                        unitPrice: unit,
                        price: unit * qty,
                        label: "Aile Albümü",
                      });
                    }}
                    className="h-9 w-full rounded border border-white/10 bg-white/5 px-2 text-sm text-rm-off-white"
                  >
                    <option value={1}>1 adet</option>
                    <option value={2}>2 adet</option>
                  </select>
                </label>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  value={s.listPrice ?? ""}
                  onChange={(e) => {
                    const raw = e.target.value;
                    const base = raw === "" ? undefined : Number(raw) || 0;
                    if (s.serviceId === BUYUK_ALBUM_ID && base != null) {
                      const pages = resolveLinePages(s);
                      updateService(i, {
                        listPrice: base,
                        price: buyukAlbumPriceFromBase(base, pages),
                      });
                      return;
                    }
                    updateService(i, {
                      listPrice: base,
                    });
                  }}
                  placeholder="Liste ₺"
                  className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs"
                />
                <input
                  type="number"
                  value={s.isGift ? 0 : (s.price ?? 0)}
                  disabled={Boolean(s.isGift)}
                  onChange={(e) =>
                    updateService(i, { price: Number(e.target.value) || 0 })
                  }
                  placeholder="Fiyat ₺"
                  className="w-20 rounded border border-white/10 bg-white/5 px-2 py-1 text-xs disabled:opacity-50"
                />
                <label className="flex items-center gap-1 text-[10px] text-rm-gray-400">
                  <input
                    type="checkbox"
                    checked={Boolean(s.isGift)}
                    onChange={(e) =>
                      updateService(i, { isGift: e.target.checked })
                    }
                  />
                  Hediye
                </label>
                <label className="flex items-center gap-1 text-[10px] text-amber-400/90">
                  <input
                    type="checkbox"
                    checked={Boolean(s.excluded)}
                    onChange={(e) =>
                      updateService(i, { excluded: e.target.checked })
                    }
                  />
                  Çarpı
                </label>
                <button
                  type="button"
                  onClick={() => removeService(i)}
                  className="ml-auto text-red-400/80"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={syncSubtotalFromServices}
          className="mt-2 flex items-center gap-1 text-xs text-rm-champagne hover:underline"
        >
          <RotateCcw className="h-3 w-3" />
          Aktif hizmetlerden ara toplam hesapla
        </button>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 border-t border-white/10 pt-4">
        <label className="text-xs text-rm-gray-500">
          Ara toplam
          <Input
            type="number"
            value={form.subtotal}
            onChange={(e) => set({ subtotal: Number(e.target.value) || 0 })}
            className="mt-1 border-white/15 bg-white/5"
          />
        </label>
        <label className="text-xs text-rm-gray-500">
          Paket indirimi (₺)
          <Input
            type="number"
            value={form.bundleDiscount}
            onChange={(e) => {
              const bundleDiscount = Number(e.target.value) || 0;
              const total = computePayableTotal(
                form.subtotal,
                bundleDiscount,
                form.couponDiscount
              );
              onChange({ ...form, bundleDiscount, total });
            }}
            className="mt-1 border-white/15 bg-white/5"
          />
          {impliedPercent != null && (
            <span className="mt-0.5 block text-[10px] text-rm-champagne">
              ≈ %{impliedPercent} indirim
            </span>
          )}
        </label>
        <label className="text-xs text-rm-gray-500">
          Paket indirimi %
          <Input
            type="number"
            min={0}
            max={100}
            placeholder="örn. 20"
            onChange={(e) => applyPercentDiscount(Number(e.target.value) || 0)}
            className="mt-1 border-white/15 bg-white/5"
          />
        </label>
        <label className="text-xs text-rm-gray-500">
          Kupon indirimi
          <Input
            type="number"
            value={form.couponDiscount}
            onChange={(e) =>
              set({ couponDiscount: Number(e.target.value) || 0 })
            }
            className="mt-1 border-white/15 bg-white/5"
          />
        </label>
        <label className="text-xs text-rm-gray-500">
          Paket toplamı
          <Input
            type="number"
            value={form.total}
            onChange={(e) => {
              const total = Number(e.target.value) || 0;
              const bundleDiscount = inferBundleDiscountFromTotal(
                form.subtotal,
                total,
                form.couponDiscount
              );
              onChange({ ...form, total, bundleDiscount });
            }}
            className="mt-1 border-white/15 bg-white/5"
          />
          <span className="mt-0.5 block text-[10px] text-rm-gray-600">
            Ara toplamdan düşünce indirim otomatik hesaplanır
          </span>
        </label>
        <button
          type="button"
          onClick={syncTotalFromBreakdown}
          className="text-xs text-rm-champagne underline sm:col-span-2"
        >
          İndirim tutarlarından paket toplamını hesapla
        </button>
        <label className="text-xs text-rm-champagne sm:col-span-2">
          Kapora
          <Input
            type="number"
            value={form.depositAmount}
            onChange={(e) =>
              set({ depositAmount: Number(e.target.value) || 0 })
            }
            className="mt-1 border-rm-champagne/30 bg-white/5"
          />
        </label>
      </div>

      <div className="flex justify-between rounded-lg border border-rm-champagne/25 bg-rm-champagne/5 px-4 py-3 font-display text-lg text-rm-champagne">
        <span>Kalan ödeme</span>
        <span className="tabular-nums">{formatPrice(remaining)}</span>
      </div>
    </div>
  );
}

export function editorStateToReservationPatch(form: ReservationEditorState) {
  return {
    customer: normalizeCustomerName(form.customer),
    services: form.services.filter((s) => s.label.trim()),
    subtotal: form.subtotal,
    bundleDiscount: form.bundleDiscount,
    couponDiscount: form.couponDiscount,
    total: form.total,
    depositAmount: form.depositAmount,
    shootingLocation: form.shootingLocation,
    shootingNote: form.shootingNote,
    studioOwned: form.studioOwned,
    note: form.customer.note,
  };
}
