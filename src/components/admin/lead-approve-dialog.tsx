"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { LeadRecord } from "@/types/site-settings";
import type { LeadLineDetail } from "@/types/reservations";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";
import { customerHasName } from "@/lib/customer-name";
import {
  ReservationEditorForm,
  editorStateToReservationPatch,
  reservationToEditorState,
  type ReservationEditorState,
} from "@/components/admin/reservation-editor-form";

type LeadApproveDialogProps = {
  lead: LeadRecord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApproved: () => void;
};

function initialServices(lead: LeadRecord): LeadLineDetail[] {
  if (lead.lineDetails?.length) return lead.lineDetails.map((s) => ({ ...s }));
  return lead.cart.lineSummary.map((label) => ({
    label,
    price: Math.round(
      lead.cart.total / Math.max(lead.cart.lineSummary.length, 1)
    ),
  }));
}

function leadToEditorState(lead: LeadRecord): ReservationEditorState {
  return reservationToEditorState({
    customer: { ...lead.customer },
    services: initialServices(lead),
    subtotal: lead.cart.subtotal,
    bundleDiscount: lead.bundleDiscount ?? 0,
    couponDiscount: lead.couponDiscount ?? 0,
    total: lead.cart.total,
    depositAmount: 0,
    shootingLocation: "",
    shootingNote: "",
  });
}

export function LeadApproveDialog({
  lead,
  open,
  onOpenChange,
  onApproved,
}: LeadApproveDialogProps) {
  const [form, setForm] = useState<ReservationEditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (lead) setForm(leadToEditorState(lead));
  }, [open]);

  const handleApprove = async () => {
    if (!lead || !form) return;
    if (!customerHasName(form.customer)) {
      setError("Çift adı gerekli (ad veya soyad alanına yazın)");
      return;
    }
    setSaving(true);
    setError("");
    const patch = editorStateToReservationPatch(form);
    if (patch.services.length === 0) {
      setError("En az bir hizmet seçin");
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "approve",
          ...patch,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Onay başarısız");
        return;
      }
      onApproved();
      notifyAdminDataChanged();
      onOpenChange(false);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

  if (!lead || !form) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/70" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-71 max-h-[92vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/10 bg-rm-black-elevated p-6 shadow-2xl">
          <Dialog.Title className="font-display text-xl text-rm-off-white">
            Rezervasyonu onayla ve düzenle
          </Dialog.Title>
          <p className="mt-1 text-sm text-rm-gray-400">
            Hizmet ekle/çıkar, çekim yeri ve saat gir — kayıt takvim + rehbere düşer.
          </p>

          <div className="mt-5">
            <ReservationEditorForm form={form} onChange={setForm} />
          </div>

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          <div className="mt-6 flex gap-2">
            <button
              type="button"
              onClick={handleApprove}
              disabled={saving}
              className="flex-1 bg-rm-champagne py-3 text-xs font-bold tracking-wide text-rm-black uppercase disabled:opacity-60"
            >
              {saving ? "Kaydediliyor…" : "Onayla ve takvime ekle"}
            </button>
            <Dialog.Close
              type="button"
              className="rounded-lg border border-white/15 px-4 py-3 text-xs text-rm-gray-400"
            >
              İptal
            </Dialog.Close>
          </div>

          <Dialog.Close className="absolute top-4 right-4 text-rm-gray-500 hover:text-rm-off-white">
            <X className="h-4 w-4" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
