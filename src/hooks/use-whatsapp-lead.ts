"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePackageStore } from "@/stores/package-store";
import { computePackageTotals } from "@/lib/package-pricing";
import {
  buildWhatsAppInquiryMessage,
  buildWhatsAppMessage,
  getWhatsAppUrl,
} from "@/lib/whatsapp";
import { trackAnalytics } from "@/lib/analytics";
import { trackGA4 } from "@/lib/analytics";
import { getPackageSessionId } from "@/lib/package-session-id";
import { readMetaAttributionFromDocument } from "@/lib/meta-attribution";
import { redirectAfterPixel } from "@/lib/paket/whatsapp-redirect";

type OpenWhatsAppOptions = {
  contentName?: string;
  requireContact?: boolean;
};

export function useWhatsAppLead() {
  const pathname = usePathname();
  const router = useRouter();

  const openWhatsApp = useCallback(
    (options: OpenWhatsAppOptions = {}) => {
      const { contentName = "whatsapp", requireContact = false } = options;
      const state = usePackageStore.getState();
      const { customer, coupon, bundleDiscounts, seasonalRules } = state;

      const hasContact =
        Boolean(customer.firstName?.trim()) && Boolean(customer.phone?.trim());

      if (requireContact && !hasContact) {
        const snap = computePackageTotals(
          state.services,
          state.selectedIds,
          state.serviceQuantities,
          bundleDiscounts,
          coupon,
          state.servicePages,
          state.campaignPricedIds,
          customer.weddingDate,
          seasonalRules
        );
        if (snap.count > 0) {
          // Meta InitiateCheckout YOK — yalnızca GA4 (funnel IC form adımında)
          trackGA4("cart_needs_contact", {
            item_count: snap.count,
            value: snap.total,
            content_name: contentName,
            page_path: pathname,
          });
        }
        if (!pathname.startsWith("/paket-olustur")) {
          router.push("/paket-olustur#paket-ozeti");
        } else {
          document.getElementById("paket-ozeti")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }
        return false;
      }

      const totals = computePackageTotals(
        state.services,
        state.selectedIds,
        state.serviceQuantities,
        bundleDiscounts,
        coupon,
        state.servicePages,
        state.campaignPricedIds,
        customer.weddingDate,
        seasonalRules
      );

      const message =
        hasContact && totals.lineItems.length > 0
          ? buildWhatsAppMessage({
              customer,
              lineItems: totals.lineItems,
              subtotal: totals.subtotal,
              bundleDiscount: totals.bundle.amount,
              couponDiscount: totals.couponDiscount,
              total: totals.total,
              couponCode: coupon?.code,
              bundlePercent: bundleDiscounts[0]?.percent ?? 20,
            })
          : buildWhatsAppInquiryMessage(hasContact ? customer : undefined);

      try {
        trackAnalytics("whatsapp_click", {
          content_name: contentName,
          value: totals.lineItems.length > 0 ? totals.total : undefined,
          num_items: totals.count,
        });
      } catch {
        /* ignore */
      }

      if (hasContact && totals.lineItems.length > 0) {
        try {
          trackAnalytics("package_complete", {
            content_name: contentName,
            value: totals.total,
            items: totals.count,
            cart_summary: totals.lineItems.map((l) => l.name).join(" | ").slice(0, 300),
          });
        } catch {
          /* ignore */
        }

        const sessionId = getPackageSessionId();
        const metaAttribution = readMetaAttributionFromDocument();

        try {
          fetch("/api/public/leads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            keepalive: true,
            body: JSON.stringify({
              source: contentName,
              sessionId,
              metaAttribution,
              customer,
              couponCode: coupon?.code,
              cart: {
                selectedIds: state.selectedIds,
                lineSummary: totals.lineItems.map((l) => l.name),
                subtotal: totals.subtotal,
                total: totals.total,
                count: totals.count,
              },
              lineDetails: totals.lineItems.map((l) => ({
                serviceId: l.id,
                label: l.name,
                price: l.lineTotal,
                quantity: l.quantity > 0 ? l.quantity : undefined,
                unitPrice:
                  l.pricingType === "quantity"
                    ? Number(l.unitPrice) || undefined
                    : undefined,
                selectedPages:
                  l.pricingType === "pages" && l.selectedPages
                    ? l.selectedPages
                    : undefined,
                listPrice:
                  l.pricingType === "pages"
                    ? Number(l.price) || undefined
                    : undefined,
                isGift: l.isGift,
              })),
              bundleDiscount: totals.bundle.amount,
              couponDiscount: totals.couponDiscount,
              eventSourceUrl: window.location.href,
            }),
          }).catch(() => {});
        } catch {
          /* ignore */
        }
      }

      redirectAfterPixel(getWhatsAppUrl(message));
      return true;
    },
    [pathname, router]
  );

  return { openWhatsApp };
}
