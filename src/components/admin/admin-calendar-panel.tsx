"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { ReservationRecord } from "@/types/reservations";
import { formatPrice } from "@/lib/utils";
import { formatMonthKey } from "@/lib/reservation-public";
import { ReservationDetailCard } from "@/components/admin/reservation-detail-card";
import { AdminVisualCalendar } from "@/components/admin/admin-visual-calendar";
import {
  CreateReservationDialog,
  type ReservationFormInitial,
} from "@/components/admin/create-reservation-dialog";
import { formatWeddingDateDisplay } from "@/lib/date-format";
import { CalendarDays, Plus } from "lucide-react";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";

function emptyCustomerForDate(iso?: string) {
  return {
    firstName: "",
    lastName: "",
    phone: "",
    weddingDate: iso ?? "",
    weddingTime: "",
    note: "",
  };
}

export function AdminCalendarPanel() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightId = searchParams.get("res");
  const newDateParam = searchParams.get("newDate");
  const [list, setList] = useState<ReservationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<ReservationRecord | null>(null);
  const [dayPick, setDayPick] = useState<{
    iso: string;
    events: ReservationRecord[];
  } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createInitial, setCreateInitial] =
    useState<ReservationFormInitial | null>(null);
  const [calendarAnchor, setCalendarAnchor] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/reservations")
      .then((r) => r.json())
      .then((data) => {
        const arr = Array.isArray(data) ? data : [];
        setList(arr);
        if (highlightId) {
          const found = arr.find((r: ReservationRecord) => r.id === highlightId);
          if (found) setSelected(found);
        }
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [highlightId]);

  useEffect(() => {
    load();
  }, [load]);

  useAdminDataSync(load);

  const openCreate = useCallback((weddingDate?: string) => {
    if (weddingDate) setCalendarAnchor(weddingDate.slice(0, 10));
    setCreateInitial({
      customer: emptyCustomerForDate(weddingDate),
      subtotal: 0,
      bundleDiscount: 0,
      couponDiscount: 0,
      total: 0,
      depositAmount: 0,
    });
    setCreateOpen(true);
    setDayPick(null);
  }, []);

  useEffect(() => {
    if (!newDateParam) return;
    openCreate(newDateParam);
    const q = new URLSearchParams(searchParams.toString());
    q.delete("newDate");
    router.replace(`/admin?${q.toString()}`, { scroll: false });
  }, [newDateParam, openCreate, router, searchParams]);

  const byMonth = useMemo(() => {
    const map = new Map<string, ReservationRecord[]>();
    for (const r of list) {
      if (!r.customer.weddingDate) continue;
      const iso = r.customer.weddingDate.slice(0, 10);
      const key = iso.slice(0, 7);
      const arr = map.get(key) ?? [];
      arr.push(r);
      map.set(key, arr);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [list]);

  const selectReservation = (r: ReservationRecord) => {
    if (r.customer.weddingDate) {
      setCalendarAnchor(r.customer.weddingDate.slice(0, 10));
    }
    setSelected(r);
    setDayPick(null);
    const q = new URLSearchParams(searchParams.toString());
    q.set("tab", "calendar");
    q.set("res", r.id);
    router.replace(`/admin?${q.toString()}`, { scroll: false });
  };

  const handleDayClick = (iso: string, events: ReservationRecord[]) => {
    setCalendarAnchor(iso);
    if (events.length === 0) {
      openCreate(iso);
      return;
    }
    if (events.length === 1) {
      selectReservation(events[0]);
      return;
    }
    setDayPick({ iso, events });
  };

  const handleCreated = () => {
    load();
    notifyAdminDataChanged();
    setCreateOpen(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-rm-gray-500">
        Takvim yükleniyor…
      </div>
    );
  }

  const createTitle = createInitial?.customer?.weddingDate
    ? `Rezervasyon — ${formatWeddingDateDisplay(createInitial.customer.weddingDate)}`
    : "Yeni rezervasyon";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-rm-champagne/20 bg-rm-champagne/5 px-5 py-4">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-6 w-6 text-rm-champagne" />
          <div>
            <p className="font-display text-lg text-rm-off-white">
              Rezervasyon takvimi
            </p>
            <p className="text-sm text-rm-gray-500">
              {list.length} onaylı çift · boş güne tıklayarak ekleyin, dolu güne
              tıklayarak düzenleyin
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          className="flex items-center gap-2 bg-rm-champagne px-4 py-2.5 text-xs font-bold tracking-wide text-rm-black uppercase"
        >
          <Plus className="h-4 w-4" />
          Rezervasyon ekle
        </button>
      </div>

      {dayPick && (
        <div className="rounded-xl border border-rm-champagne/30 bg-rm-champagne/5 p-4">
          <p className="text-sm text-rm-off-white">
            {formatWeddingDateDisplay(dayPick.iso)} — {dayPick.events.length}{" "}
            rezervasyon
          </p>
          <ul className="mt-3 space-y-2">
            {dayPick.events.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => selectReservation(r)}
                  className="w-full rounded-lg border border-white/10 bg-rm-black-elevated px-4 py-2 text-left text-sm hover:border-rm-champagne/40"
                >
                  {r.customer.firstName} {r.customer.lastName}
                  <span className="ml-2 text-rm-gray-500">
                    Kalan {formatPrice(r.remainingAmount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => openCreate(dayPick.iso)}
            className="mt-3 text-xs text-rm-champagne underline"
          >
            + Bu güne bir rezervasyon daha ekle
          </button>
        </div>
      )}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-8">
          <AdminVisualCalendar
            reservations={list}
            selectedId={selected?.id}
            anchorIso={calendarAnchor}
            onDayClick={handleDayClick}
          />

          {list.length === 0 ? (
            <p className="rounded-xl border border-white/10 bg-rm-black-elevated p-8 text-center text-sm text-rm-gray-500">
              Henüz rezervasyon yok. Takvimde bir güne tıklayın veya{" "}
              <button
                type="button"
                onClick={() => openCreate()}
                className="text-rm-champagne underline"
              >
                rezervasyon ekleyin
              </button>
              . WhatsApp teklifleri için{" "}
              <a href="/admin?tab=leads" className="text-rm-champagne underline">
                Gelen teklifler
              </a>
              .
            </p>
          ) : (
            byMonth.map(([monthKey, items]) => (
              <section
                key={monthKey}
                className="rounded-xl border border-white/10 bg-rm-black-elevated/50 p-5"
              >
                <h3 className="mb-4 font-display text-lg text-rm-champagne">
                  {formatMonthKey(monthKey)}
                </h3>
                <ul className="space-y-2">
                  {items
                    .sort(
                      (a, b) =>
                        new Date(a.customer.weddingDate).getTime() -
                        new Date(b.customer.weddingDate).getTime()
                    )
                    .map((r) => (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => selectReservation(r)}
                          className={`w-full rounded-lg border px-4 py-3 text-left transition-all ${
                            selected?.id === r.id
                              ? "border-rm-champagne/50 bg-rm-champagne/10"
                              : "border-white/10 hover:border-white/20"
                          }`}
                        >
                          <div className="flex flex-wrap justify-between gap-2">
                            <span className="font-medium text-rm-off-white">
                              {r.customer.firstName} {r.customer.lastName}
                            </span>
                            <span className="text-xs text-rm-gray-500">
                              {formatWeddingDateDisplay(r.customer.weddingDate)}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-rm-champagne">
                            Kalan: {formatPrice(r.remainingAmount)}
                          </p>
                        </button>
                      </li>
                    ))}
                </ul>
              </section>
            ))
          )}
        </div>

        <div className="xl:sticky xl:top-28 xl:self-start">
          {selected ? (
            <ReservationDetailCard
              reservation={selected}
              onUpdated={(r) => {
                setSelected(r);
                load();
              }}
              onDeleted={() => {
                setSelected(null);
                const q = new URLSearchParams(searchParams.toString());
                q.delete("res");
                router.replace(`/admin?${q.toString()}`, { scroll: false });
                load();
              }}
            />
          ) : (
            <div className="rounded-xl border border-dashed border-white/15 p-8 text-center text-sm text-rm-gray-500">
              Takvimde bir güne tıklayın — yeni rezervasyon veya mevcut çift
              detayı burada açılır.
            </div>
          )}
        </div>
      </div>

      <CreateReservationDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        initial={createInitial}
        title={createTitle}
        onCreated={handleCreated}
      />
    </div>
  );
}
