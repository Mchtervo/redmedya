"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { CalendarDays, Plus, CalendarPlus, MousePointerClick } from "lucide-react";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";
import {
  AdminPanelHeader,
  AdminEmptyState,
} from "@/components/admin/admin-panel-header";

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
  const editParam = searchParams.get("edit") === "1";
  const newDateParam = searchParams.get("newDate");
  const detailRef = useRef<HTMLDivElement>(null);
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

  useEffect(() => {
    if (!selected || !editParam) return;
    requestAnimationFrame(() => {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    const q = new URLSearchParams(searchParams.toString());
    q.delete("edit");
    router.replace(`/admin?${q.toString()}`, { scroll: false });
  }, [selected, editParam, router, searchParams]);

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
      <div className="space-y-4">
        <AdminPanelHeader
          eyebrow="Takvim"
          title="Rezervasyon takvimi"
          icon={CalendarDays}
        />
        <div className="h-72 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }

  const createTitle = createInitial?.customer?.weddingDate
    ? `Rezervasyon — ${formatWeddingDateDisplay(createInitial.customer.weddingDate)}`
    : "Yeni rezervasyon";

  return (
    <div className="space-y-6">
      <AdminPanelHeader
        eyebrow="Takvim"
        title="Rezervasyon takvimi"
        description="Onaylı düğünleri günlük olarak görün. Boş bir güne tıklayarak yeni rezervasyon ekleyin, dolu güne tıklayarak detay açın."
        icon={CalendarDays}
        meta={`${list.length} onaylı çift`}
        actions={
          <button
            type="button"
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase shadow-[0_6px_22px_rgba(196,160,82,0.3)] transition-all hover:-translate-y-0.5 hover:bg-rm-champagne-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            Rezervasyon ekle
          </button>
        }
      />

      {dayPick && (
        <div className="rounded-2xl border border-rm-champagne/30 bg-rm-champagne/[0.06] p-5">
          <p className="flex items-center gap-2 text-sm font-medium text-rm-off-white">
            <CalendarDays className="h-4 w-4 text-rm-champagne" strokeWidth={1.6} />
            {formatWeddingDateDisplay(dayPick.iso)} — {dayPick.events.length}{" "}
            rezervasyon
          </p>
          <ul className="mt-3 space-y-2">
            {dayPick.events.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => selectReservation(r)}
                  className="flex w-full items-center justify-between gap-2 rounded-xl border border-white/10 bg-rm-black-elevated/70 px-4 py-2.5 text-left text-sm transition-all hover:border-rm-champagne/40 hover:bg-rm-black-elevated"
                >
                  <span className="text-rm-off-white">
                    {r.customer.firstName} {r.customer.lastName}
                  </span>
                  <span className="text-xs text-rm-champagne">
                    Kalan {formatPrice(r.remainingAmount)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => openCreate(dayPick.iso)}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-rm-champagne underline-offset-2 hover:underline"
          >
            <Plus className="h-3 w-3" strokeWidth={2} />
            Bu güne bir rezervasyon daha ekle
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <AdminVisualCalendar
            reservations={list}
            selectedId={selected?.id}
            anchorIso={calendarAnchor}
            onDayClick={handleDayClick}
          />

          {list.length === 0 ? (
            <AdminEmptyState
              icon={CalendarPlus}
              title="Henüz onaylı rezervasyon yok"
              description="Takvimde bir güne tıklayın veya 'Rezervasyon ekle' butonunu kullanın. WhatsApp ile gelen teklifleri onayladığınızda da takvime düşer."
              action={
                <button
                  type="button"
                  onClick={() => openCreate()}
                  className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase transition-all hover:bg-rm-champagne-light"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                  İlk rezervasyonu ekle
                </button>
              }
            />
          ) : (
            byMonth.map(([monthKey, items]) => (
              <section
                key={monthKey}
                className="overflow-hidden rounded-2xl border border-white/8 bg-rm-black-elevated/60"
              >
                <div className="flex items-center justify-between border-b border-white/8 bg-white/[0.02] px-5 py-3">
                  <h3 className="font-editorial text-lg text-rm-champagne">
                    {formatMonthKey(monthKey)}
                  </h3>
                  <span className="rounded-full bg-rm-champagne/10 px-2.5 py-0.5 text-[10px] font-bold tracking-[0.18em] text-rm-champagne uppercase">
                    {items.length} çift
                  </span>
                </div>
                <ul className="divide-y divide-white/5 p-2">
                  {items
                    .sort(
                      (a, b) =>
                        new Date(a.customer.weddingDate).getTime() -
                        new Date(b.customer.weddingDate).getTime()
                    )
                    .map((r) => {
                      const isActive = selected?.id === r.id;
                      return (
                        <li key={r.id}>
                          <button
                            type="button"
                            onClick={() => selectReservation(r)}
                            className={`group flex w-full items-center justify-between gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                              isActive
                                ? "bg-rm-champagne/[0.12] shadow-[inset_0_0_0_1px_rgba(196,160,82,0.18)]"
                                : "hover:bg-white/[0.03]"
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <p className="truncate font-medium text-rm-off-white">
                                {r.customer.firstName} {r.customer.lastName}
                              </p>
                              <p className="mt-0.5 text-xs text-rm-gray-500">
                                {formatWeddingDateDisplay(r.customer.weddingDate)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-[9px] tracking-[0.18em] text-rm-gray-500 uppercase">
                                Kalan
                              </p>
                              <p className="text-sm font-semibold tabular-nums text-rm-champagne">
                                {formatPrice(r.remainingAmount)}
                              </p>
                            </div>
                          </button>
                        </li>
                      );
                    })}
                </ul>
              </section>
            ))
          )}
        </div>

        <div
          ref={detailRef}
          id="admin-reservation-detail"
          className="xl:sticky xl:top-28 xl:self-start"
        >
          {selected ? (
            <ReservationDetailCard
              reservation={selected}
              startInEditMode={editParam}
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
            <AdminEmptyState
              icon={MousePointerClick}
              title="Bir güne tıklayın"
              description="Takvimde günü seçtiğinizde rezervasyon detayı veya yeni kayıt formu burada açılır."
            />
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
