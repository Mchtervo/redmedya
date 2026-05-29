"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, ChevronDown, Phone } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import { reservationsMissingPhone } from "@/lib/reservation-phone";
import { formatWeddingDateDisplay } from "@/lib/date-format";

import { ADMIN_DATA_CHANGED } from "@/lib/admin-data-sync";

/**
 * Kompakt uyarı bandı — varsayılan kapalı, başlığa tıklayınca eksik
 * numaralı çiftlerin listesi açılır. Eski hali sayfanın 1/3'üni
 * kapatıyordu; şimdi sadece tek satır.
 */
export function AdminMissingPhoneAlerts() {
  const [missing, setMissing] = useState<ReservationRecord[]>([]);
  const [open, setOpen] = useState(false);

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
      className="mb-5 overflow-hidden rounded-xl border border-amber-500/35 bg-amber-500/[0.07]"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-amber-500/10"
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-500/15 text-amber-300">
          <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <span className="flex-1">
          <span className="text-sm font-semibold text-amber-100">
            {missing.length} çiftin telefon numarası eksik
          </span>
          <span className="ml-2 text-xs text-amber-200/70">
            düzenleyip kaydedince bu uyarı kalkar
          </span>
        </span>
        <ChevronDown
          className={`h-4 w-4 text-amber-300 transition-transform ${open ? "rotate-180" : ""}`}
          strokeWidth={1.75}
        />
      </button>
      {open && (
        <ul className="space-y-1.5 border-t border-amber-500/20 bg-black/15 px-4 py-3">
          {missing.map((r) => (
            <li
              key={r.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-amber-500/15 bg-black/20 px-3 py-2"
            >
              <span className="flex items-center gap-2 text-sm text-rm-off-white">
                <Phone className="h-3.5 w-3.5 text-amber-400" strokeWidth={1.6} />
                {r.customer.firstName} {r.customer.lastName}
                {r.customer.weddingDate && (
                  <span className="text-xs text-amber-200/70">
                    · {formatWeddingDateDisplay(r.customer.weddingDate)}
                  </span>
                )}
              </span>
              <Link
                href={`/admin?tab=calendar&res=${r.id}&edit=1`}
                className="shrink-0 rounded-full bg-amber-500/20 px-3 py-1 text-[10px] font-bold tracking-[0.18em] text-amber-100 uppercase transition-colors hover:bg-amber-500/30"
              >
                Düzenle →
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

