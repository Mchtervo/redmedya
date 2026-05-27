"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { LeadLineDetail } from "@/types/reservations";
import type { CustomerInfo } from "@/stores/package-store";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";
import { customerHasName } from "@/lib/customer-name";
import {
  ReservationEditorForm,
  editorStateToReservationPatch,
  reservationToEditorState,
  type ReservationEditorState,
} from "@/components/admin/reservation-editor-form";

export type ReservationFormInitial = {
  customer?: Partial<CustomerInfo>;
  services?: LeadLineDetail[];
  subtotal?: number;
  bundleDiscount?: number;
  couponDiscount?: number;
  total?: number;
  depositAmount?: number;
  shootingLocation?: string;
  shootingNote?: string;
  studioOwned?: boolean;
  leadId?: string;
  draftSessionId?: string;
};

type CreateReservationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial?: ReservationFormInitial | null;
  title?: string;
  onCreated: () => void;
};

const emptyEditorState = (): ReservationEditorState =>
  reservationToEditorState({
    customer: {
      firstName: "",
      lastName: "",
      phone: "",
      weddingDate: "",
      note: "",
    },
    services: [{ label: "", price: 0 }],
    subtotal: 0,
    bundleDiscount: 0,
    couponDiscount: 0,
    total: 0,
    depositAmount: 0,
    shootingLocation: "",
    shootingNote: "",
    studioOwned: false,
  });

function initialToEditorState(
  initial?: ReservationFormInitial | null
): ReservationEditorState {
  const base = emptyEditorState();
  if (!initial) return base;
  return reservationToEditorState({
    customer: { ...base.customer, ...initial.customer },
    services: initial.services?.length
      ? initial.services.map((s) => ({ ...s }))
      : base.services,
    subtotal: initial.subtotal ?? 0,
    bundleDiscount: initial.bundleDiscount ?? 0,
    couponDiscount: initial.couponDiscount ?? 0,
    total: initial.total ?? 0,
    depositAmount: initial.depositAmount ?? 0,
    shootingLocation: initial.shootingLocation ?? "",
    shootingNote: initial.shootingNote ?? "",
    studioOwned: initial.studioOwned ?? false,
  });
}

export function CreateReservationDialog({
  open,
  onOpenChange,
  initial,
  title = "Rezervasyon oluştur",
  onCreated,
}: CreateReservationDialogProps) {
  const [form, setForm] = useState<ReservationEditorState>(emptyEditorState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setForm(initialToEditorState(initial));
    setError("");
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerHasName(form.customer)) {
      setError("Çift adı gerekli (ad veya soyad alanına yazın)");
      return;
    }
    const patch = editorStateToReservationPatch(form);
    if (patch.services.length === 0) {
      setError("En az bir hizmet seçin");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...patch,
          leadId: initial?.leadId,
          draftSessionId: initial?.draftSessionId,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Kayıt başarısız");
        return;
      }
      onCreated();
      notifyAdminDataChanged();
      onOpenChange(false);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/70" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-71 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-sm border border-white/10 bg-rm-black-elevated p-6 shadow-2xl">
          <Dialog.Title className="font-display text-xl text-rm-off-white">
            {title}
          </Dialog.Title>
          <p className="mt-1 text-xs text-rm-gray-500">
            Paket hizmetlerinden seçin; fiyat, yer, saat ve notları düzenleyin.
          </p>

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            <ReservationEditorForm form={form} onChange={setForm} />

            {error && <p className="text-xs text-red-400">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-rm-champagne py-2.5 text-xs font-bold tracking-wide text-rm-black uppercase disabled:opacity-60"
              >
                {saving ? "Kaydediliyor…" : "Rezervasyonu kaydet"}
              </button>
              <Dialog.Close
                type="button"
                className="border border-white/15 px-4 py-2.5 text-xs text-rm-gray-400"
              >
                İptal
              </Dialog.Close>
            </div>
          </form>

          <Dialog.Close className="absolute top-4 right-4 text-rm-gray-500">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
