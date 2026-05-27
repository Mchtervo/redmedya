"use client";

import { useEffect } from "react";
import { usePackageStore } from "@/stores/package-store";
import { computePackageTotals } from "@/lib/package-pricing";
import { getPackageSessionId } from "@/lib/package-session-id";

export function usePackageDraftSync() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;

    const pushDraft = () => {
      const state = usePackageStore.getState();
      if (!state.cmsLoaded) return;

      const totals = computePackageTotals(
        state.services,
        state.selectedIds,
        state.serviceQuantities,
        state.bundleDiscounts,
        state.coupon,
        state.servicePages,
        state.campaignPricedIds,
        state.customer.weddingDate,
        state.seasonalRules
      );

      const hasCart = totals.count > 0;
      const hasContact =
        Boolean(state.customer.firstName?.trim()) ||
        Boolean(state.customer.phone?.trim());

      if (!hasCart && !hasContact) return;

      fetch("/api/public/package-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: getPackageSessionId(),
          customer: state.customer,
          selectedIds: state.selectedIds,
          lineDetails: totals.lineItems.map((l) => ({
            label: l.name,
            price: l.lineTotal,
            isGift: l.isGift,
          })),
          lineSummary: totals.lineItems.map((l) => l.name),
          subtotal: totals.subtotal,
          total: totals.total,
          count: totals.count,
          whatsappClicked: false,
        }),
      }).catch(() => {});
    };

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(pushDraft, 1200);
    };

    schedule();
    const unsub = usePackageStore.subscribe(schedule);

    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, []);
}
