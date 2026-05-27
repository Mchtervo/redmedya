"use client";

import { Flame, TrendingDown } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { CAMPAIGN_KLIP_META, isCampaignKlipId } from "@/config/campaign-klips";
import type { SelectedLineItem } from "@/stores/package-store";

type CartSavingsBreakdownProps = {
  campaignKlipLines: SelectedLineItem[];
  campaignKlipSavings: number;
  bundleAmount: number;
  bundlePercent: number;
  couponDiscount: number;
  giftSavings: number;
  totalSavings: number;
  subtotal: number;
  payableTotal: number;
};

export function CartSavingsBreakdown({
  campaignKlipLines,
  campaignKlipSavings,
  bundleAmount,
  bundlePercent,
  couponDiscount,
  giftSavings,
  totalSavings,
  subtotal,
  payableTotal,
}: CartSavingsBreakdownProps) {
  const hasAnySavings =
    totalSavings > 0 ||
    campaignKlipSavings > 0 ||
    bundleAmount > 0 ||
    couponDiscount > 0 ||
    giftSavings > 0;

  const showDiscountBlocks = hasAnySavings || campaignKlipLines.length > 0;
  if (!showDiscountBlocks && payableTotal <= 0) return null;

  return (
    <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
      {showDiscountBlocks && campaignKlipLines.length > 0 && (
        <div className="rounded-md border border-rm-champagne/30 bg-rm-champagne/8 p-3">
          <div className="flex items-center gap-2">
            <Flame className="h-3.5 w-3.5 shrink-0 text-rm-champagne" />
            <p className="text-[10px] font-bold tracking-[0.2em] text-rm-champagne uppercase">
              Size özel kampanya — kazancınız
            </p>
          </div>
          <p className="mt-1.5 text-[11px] leading-relaxed text-rm-gray-400">
            Bu kliplere ek %20 uygulanmaz; liste fiyatının altında kilitlendi.
          </p>
          <ul className="mt-3 space-y-2">
            {campaignKlipLines.map((line) => {
              const meta = isCampaignKlipId(line.id)
                ? CAMPAIGN_KLIP_META[line.id]
                : null;
              const saved = (line.originalLineTotal ?? 0) - line.lineTotal;
              const label = meta?.shortTitle ?? line.name;

              return (
                <li
                  key={line.id}
                  className="rounded-sm border border-white/8 bg-rm-black/30 px-2.5 py-2"
                >
                  <p className="text-xs font-medium text-rm-off-white">{label}</p>
                  <p className="mt-0.5 text-[11px] text-rm-gray-400">
                    <span className="line-through">{formatPrice(line.originalLineTotal ?? 0)}</span>
                    {" → "}
                    <span className="font-semibold text-rm-champagne">
                      {formatPrice(line.lineTotal)}
                    </span>
                  </p>
                  <p className="mt-1 text-[11px] font-semibold text-emerald-400">
                    {formatPrice(saved)} kara girdiniz — fırsatı kaçırmayın
                  </p>
                </li>
              );
            })}
          </ul>
          {campaignKlipLines.length > 1 && (
            <p className="mt-2 text-right text-xs font-semibold text-emerald-400">
              Kampanya klipleri toplam: +{formatPrice(campaignKlipSavings)}
            </p>
          )}
        </div>
      )}

      {showDiscountBlocks && (
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-rm-gray-400">
          <TrendingDown className="h-3.5 w-3.5 text-emerald-400/80" strokeWidth={1.5} />
          <span className="text-[10px] font-semibold tracking-wider uppercase">
            İndirim özeti
          </span>
        </div>

        {bundleAmount > 0 && (
          <div className="flex justify-between text-emerald-400/90">
            <span>Paket indirimi (%{bundlePercent})</span>
            <span className="tabular-nums font-medium">−{formatPrice(bundleAmount)}</span>
          </div>
        )}

        {campaignKlipSavings > 0 && campaignKlipLines.length === 1 && (
          <div className="flex justify-between text-emerald-400/90">
            <span>Size özel kampanya klip</span>
            <span className="tabular-nums font-medium">
              +{formatPrice(campaignKlipSavings)}
            </span>
          </div>
        )}
        {campaignKlipSavings > 0 && campaignKlipLines.length > 1 && (
          <div className="flex justify-between text-emerald-400/90">
            <span>
              Kampanya klipleri ({formatPrice(campaignKlipSavings / Math.max(campaignKlipLines.length, 1))} ×{" "}
              {campaignKlipLines.length})
            </span>
            <span className="tabular-nums font-medium">
              +{formatPrice(campaignKlipSavings)}
            </span>
          </div>
        )}

        {giftSavings > 0 && (
          <div className="flex justify-between text-emerald-400/90">
            <span>Drone hediye (dış çekim)</span>
            <span className="tabular-nums font-medium">+{formatPrice(giftSavings)}</span>
          </div>
        )}

        {couponDiscount > 0 && (
          <div className="flex justify-between text-emerald-400/90">
            <span>Kupon indirimi</span>
            <span className="tabular-nums font-medium">−{formatPrice(couponDiscount)}</span>
          </div>
        )}

        {totalSavings > 0 && (
          <div className="mt-2 flex justify-between border-t border-white/10 pt-2 font-medium text-rm-off-white">
            <span>Toplam kazanç</span>
            <span className="tabular-nums text-emerald-400">
              {formatPrice(totalSavings)}
            </span>
          </div>
        )}

      </div>
      )}

        <div className="mt-3 space-y-1 border-t border-rm-champagne/25 pt-3">
          {subtotal > payableTotal && (
            <div className="flex justify-between text-xs text-rm-gray-500">
              <span>İndirim öncesi</span>
              <span className="tabular-nums line-through">
                {formatPrice(subtotal)}
              </span>
            </div>
          )}
          <div className="flex justify-between items-baseline gap-2">
            <span className="text-sm font-semibold text-rm-off-white">
              Ödenecek tutar
            </span>
            <span className="font-editorial text-2xl tabular-nums text-rm-champagne">
              {formatPrice(payableTotal)}
            </span>
          </div>
        </div>
    </div>
  );
}
