"use client";

import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { RehberContact } from "@/types/reservations";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";

type RehberEditDialogProps = {
  contact: RehberContact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
};

export function RehberEditDialog({
  contact,
  open,
  onOpenChange,
  onSaved,
}: RehberEditDialogProps) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    weddingDate: "",
    note: "",
    shootingLocation: "",
    shootingNote: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!contact) return;
    setForm({
      firstName: contact.firstName,
      lastName: contact.lastName,
      phone: contact.phone,
      weddingDate: contact.weddingDate ?? "",
      note: contact.note ?? "",
      shootingLocation: contact.shootingLocation ?? "",
      shootingNote: contact.shootingNote ?? "",
    });
    setError("");
  }, [contact, open]);

  const save = async () => {
    if (!contact) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/admin/rehber/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        setError("Kayıt başarısız");
        return;
      }
      onSaved();
      notifyAdminDataChanged();
      onOpenChange(false);
    } catch {
      setError("Bağlantı hatası");
    } finally {
      setSaving(false);
    }
  };

  if (!contact) return null;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-70 bg-black/70" />
        <Dialog.Content className="fixed top-1/2 left-1/2 z-71 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-white/10 bg-rm-black-elevated p-6">
          <Dialog.Title className="font-display text-xl text-rm-off-white">
            Rehber kaydını düzenle
          </Dialog.Title>
          {contact.reservationId && (
            <p className="mt-1 text-xs text-rm-champagne">
              Rezervasyonla senkron — değişiklik takvimde de güncellenir.
            </p>
          )}

          <div className="mt-4 grid gap-2">
            <Input
              placeholder="Ad"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="border-white/15 bg-white/5"
            />
            <Input
              placeholder="Soyad"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="border-white/15 bg-white/5"
            />
            <Input
              placeholder="Telefon"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="border-white/15 bg-white/5"
            />
            <Input
              type="date"
              value={form.weddingDate}
              onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
              className="border-white/15 bg-white/5"
            />
            <Input
              placeholder="Çekim alanı"
              value={form.shootingLocation}
              onChange={(e) =>
                setForm((f) => ({ ...f, shootingLocation: e.target.value }))
              }
              className="border-white/15 bg-white/5"
            />
            <Textarea
              placeholder="Ekip notu"
              value={form.shootingNote}
              onChange={(e) => setForm((f) => ({ ...f, shootingNote: e.target.value }))}
              className="border-white/15 bg-white/5"
            />
            <Textarea
              placeholder="Müşteri notu"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="border-white/15 bg-white/5"
            />
          </div>

          {contact.reservationId && (
            <a
              href={`/admin?tab=calendar&res=${contact.reservationId}`}
              className="mt-3 inline-block text-xs text-rm-champagne underline"
            >
              Tam rezervasyon düzenle (hizmetler & saatler) →
            </a>
          )}

          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="flex-1 bg-rm-champagne py-2.5 text-xs font-bold text-rm-black uppercase"
            >
              {saving ? "…" : "Kaydet"}
            </button>
            <Dialog.Close className="border border-white/15 px-4 py-2.5 text-xs text-rm-gray-400">
              İptal
            </Dialog.Close>
          </div>

          <Dialog.Close className="absolute top-4 right-4">
            <X className="h-4 w-4 text-rm-gray-500" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
