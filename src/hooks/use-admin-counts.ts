"use client";

import { useCallback, useEffect, useState } from "react";
import type { ReservationRecord } from "@/types/reservations";
import type { LeadRecord } from "@/types/site-settings";
import { reservationsMissingPhone } from "@/lib/reservation-phone";
import { ADMIN_DATA_CHANGED } from "@/lib/admin-data-sync";

export type AdminCounts = {
  pendingLeads: number;
  totalLeads: number;
  reservations: number;
  missingPhone: number;
  weekWeddings: number;
};

const EMPTY: AdminCounts = {
  pendingLeads: 0,
  totalLeads: 0,
  reservations: 0,
  missingPhone: 0,
  weekWeddings: 0,
};

/**
 * Sidebar badge'leri ve hızlı durum göstergeleri için kullanılır.
 * Hem leads hem reservations endpoint'inden veri çekip türetir.
 */
export function useAdminCounts(): AdminCounts {
  const [counts, setCounts] = useState<AdminCounts>(EMPTY);

  const refresh = useCallback(() => {
    Promise.all([
      fetch("/api/admin/leads")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
      fetch("/api/admin/reservations")
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => []),
    ]).then(([leadData, resData]: [LeadRecord[], ReservationRecord[]]) => {
      const leads = Array.isArray(leadData) ? leadData : [];
      const reservations = Array.isArray(resData) ? resData : [];
      const resIds = new Set<string>(
        reservations.map((r) => r.id).filter(Boolean)
      );

      let pending = 0;
      for (const l of leads) {
        if (l.status === "rejected") continue;
        if (
          l.status === "approved" &&
          l.reservationId &&
          resIds.has(l.reservationId)
        ) {
          continue;
        }
        pending++;
      }

      const now = new Date();
      const day = now.getDay();
      const start = new Date(now);
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - ((day + 6) % 7)); // pazartesi
      const end = new Date(start);
      end.setDate(start.getDate() + 7);

      const weekWeddings = reservations.filter((r) => {
        if (!r.customer.weddingDate) return false;
        const t = new Date(r.customer.weddingDate).getTime();
        return t >= start.getTime() && t < end.getTime();
      }).length;

      setCounts({
        pendingLeads: pending,
        totalLeads: leads.length,
        reservations: reservations.length,
        missingPhone: reservationsMissingPhone(reservations).length,
        weekWeddings,
      });
    });
  }, []);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    window.addEventListener(ADMIN_DATA_CHANGED, handler);
    const intv = window.setInterval(refresh, 60_000);
    return () => {
      window.removeEventListener(ADMIN_DATA_CHANGED, handler);
      window.clearInterval(intv);
    };
  }, [refresh]);

  return counts;
}
