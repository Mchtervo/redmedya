"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, Phone } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import { reservationsMissingPhone } from "@/lib/reservation-phone";
import { formatWeddingDateDisplay } from "@/lib/date-format";

import { ADMIN_DATA_CHANGED } from "@/lib/admin-data-sync";

export function AdminMissingPhoneAlerts() {
  const [missing, setMissing] = useState<ReservationRecord[]>([]);

  const load = useCallback(() => {
    fetch("/api/admin/reservations")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setMissing(reservationsMissingPhone(list));
      })
      .catch(() => setMissing([]));
  }, []);

  useEffect(() => {
    load();
    const onRefresh = () => load();
    window.addEventListener(ADMIN_DATA_CHANGED, onRefresh);
    return () => window.removeEventListener(ADMIN_DATA_CHANGED, onRefresh);
  }, [load]);

  if (missing.length === 0) return null;

  return (
    <div
      role="alert"
      className="mb-6 rounded-xl border border-amber-500/50 bg-amber-500/10 px-4 py-4 md:px-5"
    >
      <div className="flex gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
        <div className="min-w-0 flex-1">
          <p className="font-display text-base text-amber-100">
            Telefon numarası eksik — {missing.length} çift
          </p>
          <p className="mt-1 text-sm text-amber-200/80">
            Rezervasyon kayıtlı ama numara yok. Düzenleyip kaydedince bu uyarı
            kalkar.
          </p>
          <ul className="mt-3 space-y-2">
            {missing.map((r) => (
              <li
                key={r.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/25 bg-black/20 px-3 py-2"
              >
                <span className="text-sm text-rm-off-white">
                  <Phone className="mr-1.5 inline h-3.5 w-3.5 text-amber-400" />
                  {r.customer.firstName} {r.customer.lastName}
                  {r.customer.weddingDate && (
                    <span className="ml-2 text-xs text-amber-200/70">
                      · {formatWeddingDateDisplay(r.customer.weddingDate)}
                    </span>
                  )}
                </span>
                <Link
                  href={`/admin?tab=calendar&res=${r.id}&edit=1`}
                  className="shrink-0 rounded bg-amber-500/20 px-3 py-1.5 text-xs font-bold tracking-wide text-amber-100 uppercase hover:bg-amber-500/30"
                >
                  Düzenle →
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

