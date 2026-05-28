"use client";

import { useState } from "react";
import { usePackageStore } from "@/stores/package-store";
import { usePackageTotals } from "@/hooks/use-package-totals";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { formatPrice, cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { WeddingDatePicker } from "@/components/ui/wedding-date-picker";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";
import { X, Tag, ShoppingBag, Check, MessageCircle } from "lucide-react";
import { CartCampaignKlips } from "@/components/package/cart-campaign-klips";
import { CartSavingsBreakdown } from "@/components/package/cart-savings-breakdown";
import { PackageSalesAdvisor } from "@/components/package/package-sales-advisor";
import { DateCapacityAlerts } from "@/components/package/date-capacity-alerts";

type CartSummaryProps = {
  className?: string;
  compact?: boolean;
};

export function CartSummary({ className, compact }: CartSummaryProps) {
  const customer = usePackageStore((s) => s.customer);
  const coupon = usePackageStore((s) => s.coupon);
  const setCustomer = usePackageStore((s) => s.setCustomer);
  const applyCouponCode = usePackageStore((s) => s.applyCouponCode);
  const clearCoupon = usePackageStore((s) => s.clearCoupon);
  const toggleService = usePackageStore((s) => s.toggleService);
  const setServiceQuantity = usePackageStore((s) => s.setServiceQuantity);
  const {
    lineItems,
    subtotal,
    count,
    bundle,
    couponDiscount,
    total,
    campaignKlipLines,
    campaignKlipSavings,
    giftSavings,
    totalSavings,
  } = usePackageTotals();

  const { settings } = useSiteSettings();
  const { openWhatsApp } = useWhatsAppLead();

  const [couponError, setCouponError] = useState("");
  const [showForm, setShowForm] = useState(!compact);

  const applyCoupon = () => {
    const code = (document.getElementById("coupon-input") as HTMLInputElement)?.value;
    if (!code) return;
    const ok = applyCouponCode(code);
    if (ok) {
      setCouponError("");
      trackMetaEvent("DiscountUse", { coupon_code: code.toUpperCase() });
    } else {
      setCouponError("Geçersiz kupon");
      clearCoupon();
    }
  };

  const removeLine = (id: string, pricingType?: string) => {
    if (pricingType === "quantity") setServiceQuantity(id, 0);
    else toggleService(id);
  };

  const handleWhatsApp = () => {
    if (!customer.firstName?.trim() || !customer.phone?.trim()) {
      setShowForm(true);
      trackMetaEvent("FormStart");
      return;
    }
    openWhatsApp({ contentName: "package_whatsapp" });
  };

  return (
    <aside
      className={cn(
        "flex flex-col overflow-visible rounded-2xl border border-white/8 bg-rm-black-elevated/80 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] backdrop-blur-xl",
        className
      )}
    >
      <div className="relative overflow-hidden border-b border-white/8 px-6 py-6">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -right-20 h-44 w-44 rounded-full bg-rm-champagne/[0.08] blur-3xl"
        />
        <div className="relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-rm-champagne/15">
                <ShoppingBag className="h-4 w-4 text-rm-champagne" strokeWidth={1.75} />
              </span>
              <span className="font-editorial text-xl text-rm-off-white">
                Sepet özeti
              </span>
            </div>
            {count > 0 && (
              <span className="rounded-full border border-rm-champagne/30 bg-rm-champagne/15 px-3 py-1 text-[10px] font-bold tracking-wider text-rm-champagne uppercase">
                {count} hizmet
              </span>
            )}
          </div>
          <p className="mt-4 text-[10px] font-semibold tracking-[0.25em] text-rm-gray-500 uppercase">
            Ödenecek tutar
          </p>
          <p className="mt-1 font-editorial text-[2.75rem] leading-none tabular-nums text-rm-champagne">
            {formatPrice(total)}
          </p>
          {totalSavings > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Check className="h-3 w-3" strokeWidth={2.5} />
              {formatPrice(totalSavings)} kazanç sağladınız
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        {lineItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-rm-gray-400">
            Soldan hizmet seçin — fiyat burada görünür.
          </p>
        ) : (
          <ul className="max-h-48 space-y-2 overflow-x-hidden overflow-y-auto">
            {lineItems.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-2 rounded-md bg-white/5 px-3 py-2.5 text-sm"
              >
                <span className="min-w-0 truncate text-rm-gray-100">
                  {s.name}
                  {s.isGift && (
                    <span className="ml-1 text-[10px] font-bold text-emerald-400">
                      HEDİYE
                    </span>
                  )}
                  {s.isCampaignPrice && (
                    <span className="ml-1 text-[10px] font-bold text-rm-champagne">
                      KAMPANYA · %20 hariç
                    </span>
                  )}
                  {!s.isCampaignPrice && s.excludeFromBundleDiscount && (
                    <span className="ml-1 text-[10px] text-rm-gray-500">%20 hariç</span>
                  )}
                  {s.quantity > 1 ? ` ×${s.quantity}` : ""}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  {s.isGift || s.isCampaignPrice ? (
                    <span className="text-right">
                      <span
                        className={cn(
                          "block font-medium tabular-nums",
                          s.isGift ? "text-emerald-400" : "text-rm-champagne"
                        )}
                      >
                        {formatPrice(s.lineTotal)}
                      </span>
                      <span className="text-[10px] text-rm-gray-500 line-through">
                        {formatPrice(s.originalLineTotal ?? 0)}
                      </span>
                    </span>
                  ) : (
                    <span className="font-medium tabular-nums text-rm-champagne">
                      {formatPrice(s.lineTotal)}
                    </span>
                  )}
                  {!s.isGift && (
                    <button
                      type="button"
                      onClick={() => removeLine(s.id, s.pricingType)}
                      className="text-rm-gray-500 hover:text-rm-off-white"
                      aria-label="Kaldır"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <DateCapacityAlerts className={lineItems.length > 0 ? "mt-4" : undefined} />

        {lineItems.length > 0 && (
          <>
            <PackageSalesAdvisor />
            <CartCampaignKlips />
          </>
        )}

        {lineItems.length > 0 && (
          <div className="mt-4 space-y-1.5 border-t border-white/10 pt-4 text-sm">
            <div className="flex justify-between text-rm-gray-400">
              <span>Ara toplam</span>
              <span className="tabular-nums text-rm-gray-200">
                {formatPrice(subtotal)}
              </span>
            </div>
            <CartSavingsBreakdown
              campaignKlipLines={campaignKlipLines}
              campaignKlipSavings={campaignKlipSavings}
              bundleAmount={bundle.amount}
              bundlePercent={bundle.percent}
              couponDiscount={couponDiscount}
              giftSavings={giftSavings}
              totalSavings={totalSavings}
              subtotal={subtotal}
              payableTotal={total}
            />
          </div>
        )}

        {!compact && (
          <>
            <div className="mt-4 flex gap-2">
              <Input
                id="coupon-input"
                placeholder="İndirim kodu"
                className="flex-1 border-white/15 bg-white/5"
              />
              <Button type="button" variant="outline" size="icon" onClick={applyCoupon}>
                <Tag size={16} />
              </Button>
            </div>
            {couponError && (
              <p className="mt-1 text-xs text-red-400">{couponError}</p>
            )}

            <div className="mt-6 space-y-3">
              <p className="text-xs font-medium tracking-wide text-rm-champagne uppercase">
                İletişim bilgileri
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Ad *"
                  value={customer.firstName}
                  onChange={(e) => setCustomer({ firstName: e.target.value })}
                  className="border-white/15 bg-white/5"
                />
                <Input
                  placeholder="Soyad"
                  value={customer.lastName}
                  onChange={(e) => setCustomer({ lastName: e.target.value })}
                  className="border-white/15 bg-white/5"
                />
              </div>
              <Input
                placeholder="Telefon *"
                type="tel"
                value={customer.phone}
                onChange={(e) => setCustomer({ phone: e.target.value })}
                className="border-white/15 bg-white/5"
              />
              <WeddingDatePicker
                value={customer.weddingDate}
                onChange={(weddingDate) => setCustomer({ weddingDate })}
                blockedDates={settings.blockedDates}
              />
              <Textarea
                placeholder="Not (isteğe bağlı)"
                value={customer.note}
                onChange={(e) => setCustomer({ note: e.target.value })}
                className="min-h-[72px] border-white/15 bg-white/5"
              />
            </div>
          </>
        )}

        {compact && !showForm && lineItems.length > 0 && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="mt-3 text-center text-xs text-rm-champagne underline"
          >
            Bilgilerimi gir
          </button>
        )}

        {compact && showForm && (
          <div className="mt-3 space-y-2">
            <Input
              placeholder="Ad *"
              value={customer.firstName}
              onChange={(e) => setCustomer({ firstName: e.target.value })}
              className="border-white/15 bg-white/5 text-sm"
            />
            <Input
              placeholder="Telefon *"
              type="tel"
              value={customer.phone}
              onChange={(e) => setCustomer({ phone: e.target.value })}
              className="border-white/15 bg-white/5 text-sm"
            />
          </div>
        )}

        <Button
          variant="whatsapp"
          className="group mt-5 h-auto w-full py-5 text-sm font-bold tracking-wide shadow-[0_10px_35px_rgba(37,211,102,0.35)]"
          rounded="full"
          onClick={handleWhatsApp}
          disabled={lineItems.length === 0}
        >
          <MessageCircle className="h-4 w-4" strokeWidth={2} />
          Rezervasyonu WhatsApp ile onayla
          <span
            aria-hidden
            className="transition-transform group-hover:translate-x-0.5"
          >
            →
          </span>
        </Button>

        {lineItems.length > 0 && (
          <ul className="mt-3 space-y-1 text-[10px] text-rm-gray-500">
            <li className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-400/80" strokeWidth={2.5} />
              Ad, soyad, telefon ve düğün tarihiniz mesaja eklenir
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-400/80" strokeWidth={2.5} />
              Seçtiğiniz tüm hizmetler kalem kalem listelenir
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="h-3 w-3 text-emerald-400/80" strokeWidth={2.5} />
              İndirim ve toplam tutar otomatik hesaplanır
            </li>
          </ul>
        )}
      </div>
    </aside>
  );
}
