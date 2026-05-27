"use client";

import { useEffect, useState } from "react";
import { XCircle } from "lucide-react";
import type { ReservationRecord } from "@/types/reservations";
import { formatPrice, cn } from "@/lib/utils";
import { formatWeddingSchedule } from "@/lib/date-format";
import {
  buildCustomerConfirmationMessage,
  getWhatsAppUrl,
} from "@/lib/whatsapp";
import {
  ReservationEditorForm,
  editorStateToReservationPatch,
  reservationToEditorState,
  type ReservationEditorState,
} from "@/components/admin/reservation-editor-form";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";
import { customerHasName, formatCustomerName } from "@/lib/customer-name";
import { hasCustomerPhone } from "@/lib/reservation-phone";
import { formatLeadLineLabel } from "@/lib/service-line";
type ReservationDetailCardProps = {
  reservation: ReservationRecord;
  onUpdated?: (r: ReservationRecord) => void;
  onDeleted?: () => void;
  /** URL ?edit=1 veya eksik telefon uyarısından gelince form açık başlar */
  startInEditMode?: boolean;
};

export function ReservationDetailCard({
  reservation,
  onUpdated,
  onDeleted,
  startInEditMode = false,
}: ReservationDetailCardProps) {
  const [editing, setEditing] = useState(startInEditMode);
  const [form, setForm] = useState<ReservationEditorState>(() =>
    reservationToEditorState(reservation)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (startInEditMode) setEditing(true);
  }, [reservation.id, startInEditMode]);

  useEffect(() => {
    if (!editing) setForm(reservationToEditorState(reservation));
  }, [reservation, editing]);

  const remaining = Math.max(
    0,
    (editing ? form.total : reservation.total) -
      (editing ? form.depositAmount : reservation.depositAmount)
  );

  const save = async () => {
    const patch = editorStateToReservationPatch(form);
    if (!customerHasName(form.customer)) {
      setError("Çift adı gerekli (ad veya soyad alanına yazın)");
      return;
    }
    if (patch.services.length === 0) {
      setError("En az bir hizmet kalmalı");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Kayıt başarısız");
        return;
      }
      onUpdated?.(data);
      setEditing(false);
      notifyAdminDataChanged();
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Rezervasyon silinsin mi? Rehber kaydı kalabilir.")) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/reservations/${reservation.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError("Silinemedi");
        return;
      }
      onDeleted?.();
      notifyAdminDataChanged();
    } finally {
      setSaving(false);
    }
  };

  const shareWhatsApp = () => {
    const f = editing ? form : reservationToEditorState(reservation);
    if (!hasCustomerPhone(f.customer.phone)) {
      setError("WhatsApp için önce telefon numarası ekleyin.");
      return;
    }
    const active = f.services.filter((s) => !s.excluded);
    const msg = buildCustomerConfirmationMessage({
      customerName: f.customer.firstName || "değerli müşterimiz",
      weddingDate: f.customer.weddingDate,
      services: active,
      subtotal: f.subtotal,
      bundleDiscount: f.bundleDiscount,
      couponDiscount: f.couponDiscount,
      total: f.total,
      depositAmount: f.depositAmount,
      remainingAmount: remaining,
    });
    window.open(
      getWhatsAppUrl(msg, f.customer.phone),
      "_blank",
      "noopener,noreferrer"
    );
  };

  const r = editing ? null : reservation;

  return (
    <article className="rounded-xl border border-rm-champagne/25 bg-rm-black-elevated p-5 shadow-lg">
      {editing ? (
        <ReservationEditorForm form={form} onChange={setForm} />
      ) : (
        <>
          <h3 className="font-display text-xl text-rm-off-white">
            {formatCustomerName(r!.customer)}
          </h3>
          {hasCustomerPhone(r!.customer.phone) ? (
            <p className="text-sm text-rm-gray-400">{r!.customer.phone}</p>
          ) : (
            <p className="text-sm font-medium text-amber-400">
              Telefon eksik — düzenleyip kaydedin
            </p>
          )}
          {formatWeddingSchedule(
            r!.customer.weddingDate,
            r!.customer.weddingTime
          ) && (
            <p className="mt-1 text-rm-champagne">
              {formatWeddingSchedule(
                r!.customer.weddingDate,
                r!.customer.weddingTime
              )}
            </p>
          )}
          {r!.studioOwned && (
            <p className="mt-2 text-sm font-medium text-rm-champagne">
              Plato bize ait
            </p>
          )}
          {r!.shootingLocation && (
            <p className="mt-2 text-sm text-rm-gray-300">
              📍 {r!.shootingLocation}
            </p>
          )}
          {r!.shootingNote && (
            <p className="mt-1 text-xs text-rm-gray-500">Not: {r!.shootingNote}</p>
          )}

          <ul className="mt-4 space-y-2 text-sm">
            {r!.services.map((s, i) => (
              <li
                key={`${i}-${s.label}`}
                className={cn(
                  "rounded border border-white/5 px-2 py-1.5",
                  s.excluded && "opacity-50 line-through"
                )}
              >
                <div className="flex justify-between gap-2">
                  <span>{formatLeadLineLabel(s)}</span>
                  <span className="shrink-0 text-rm-champagne">
                    {s.isGift ? "Hediye" : formatPrice(s.price)}
                  </span>
                </div>
                {(s.shootingLocation || s.shootingTime) && (
                  <p className="mt-0.5 text-[10px] text-rm-gray-500">
                    {[s.shootingLocation, s.shootingTime].filter(Boolean).join(" · ")}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-1 border-t border-white/10 pt-3 text-sm">
            <div className="flex justify-between">
              <span className="text-rm-gray-500">Paket toplamı</span>
              <span>{formatPrice(r!.total)}</span>
            </div>
            <div className="flex justify-between text-emerald-400/90">
              <span>Kapora</span>
              <span>−{formatPrice(r!.depositAmount)}</span>
            </div>
            <div className="flex justify-between font-display text-lg text-rm-champagne">
              <span>Kalan</span>
              <span>{formatPrice(r!.remainingAmount)}</span>
            </div>
          </div>
        </>
      )}

      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

      <div className="mt-5 flex flex-wrap gap-2">
        {editing ? (
          <>
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 bg-rm-champagne py-2.5 text-xs font-bold tracking-wide text-rm-black uppercase"
            >
              {saving ? "Kaydediliyor…" : "Kaydet (rehber güncellenir)"}
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(reservationToEditorState(reservation));
                setEditing(false);
              }}
              className="border border-white/20 px-4 py-2.5 text-xs text-rm-gray-400"
            >
              İptal
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex-1 border border-white/20 py-2.5 text-xs uppercase text-rm-off-white"
            >
              Düzenle
            </button>
            <button
              type="button"
              onClick={shareWhatsApp}
              className="flex-1 bg-[#25D366] py-2.5 text-xs font-bold text-white uppercase"
            >
              Paylaş
            </button>
          </>
        )}
      </div>

      {!editing && (
        <button
          type="button"
          onClick={handleDelete}
          disabled={saving}
          className="mt-3 flex w-full items-center justify-center gap-2 border border-red-500/30 py-2 text-xs text-red-400/90"
        >
          <XCircle className="h-4 w-4" />
          Rezervasyonu sil
        </button>
      )}
    </article>
  );
}
