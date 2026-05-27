"use client";

import { useCallback, useEffect, useState } from "react";
import type { RehberContact } from "@/types/reservations";
import { Input } from "@/components/ui/input";
import { RehberEditDialog } from "@/components/admin/rehber-edit-dialog";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";

export function AdminRehberPanel() {
  const [contacts, setContacts] = useState<RehberContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editContact, setEditContact] = useState<RehberContact | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    weddingDate: "",
    note: "",
    shootingLocation: "",
    shootingNote: "",
  });

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/rehber")
      .then((r) => r.json())
      .then((d) => setContacts(Array.isArray(d) ? d : []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useAdminDataSync(load);

  const addManual = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch("/api/admin/rehber", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setForm({
      firstName: "",
      lastName: "",
      phone: "",
      weddingDate: "",
      note: "",
      shootingLocation: "",
      shootingNote: "",
    });
    load();
    notifyAdminDataChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) return;
    await fetch(`/api/admin/rehber?id=${id}`, { method: "DELETE" });
    load();
    notifyAdminDataChanged();
  };

  if (loading) return <p className="text-sm text-rm-gray-400">Yükleniyor…</p>;

  return (
    <div className="space-y-8">
      <form
        onSubmit={addManual}
        className="rounded-xl border border-white/10 bg-rm-black-elevated p-5"
      >
        <h3 className="font-display text-lg text-rm-off-white">Manuel kişi ekle</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
            placeholder="Telefon *"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="border-white/15 bg-white/5 sm:col-span-2"
            required
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
          <Input
            placeholder="Not"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="border-white/15 bg-white/5 sm:col-span-2"
          />
        </div>
        <button
          type="submit"
          className="mt-4 bg-rm-champagne px-5 py-2 text-xs font-bold tracking-wide text-rm-black uppercase"
        >
          Ekle
        </button>
      </form>

      <p className="text-sm text-rm-gray-400">
        {contacts.length} kişi · Rezervasyon kayıtları otomatik senkron
      </p>

      <ul className="space-y-2">
        {contacts.map((c) => (
          <li
            key={c.id}
            className="rounded-xl border border-white/10 bg-rm-black-elevated px-4 py-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium text-rm-off-white">
                  {c.firstName} {c.lastName}
                </p>
                <p className="text-sm text-rm-gray-400">
                  {c.phone}
                  {c.weddingDate && ` · ${c.weddingDate}`}
                </p>
                {c.shootingLocation && (
                  <p className="mt-1 text-xs text-rm-gray-500">📍 {c.shootingLocation}</p>
                )}
                {c.shootingNote && (
                  <p className="text-xs text-rm-gray-500">{c.shootingNote}</p>
                )}
                <span className="text-[10px] tracking-wider text-rm-gray-600 uppercase">
                  {c.source === "reservation" ? "Rezervasyon" : "Manuel"}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setEditContact(c)}
                  className="text-xs text-rm-champagne underline"
                >
                  Düzenle
                </button>
                {c.reservationId && (
                  <a
                    href={`/admin?tab=calendar&res=${c.reservationId}`}
                    className="text-xs text-rm-gray-400 underline"
                  >
                    Takvim
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="text-xs text-red-400/80"
                >
                  Sil
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <RehberEditDialog
        contact={editContact}
        open={Boolean(editContact)}
        onOpenChange={(o) => !o && setEditContact(null)}
        onSaved={load}
      />
    </div>
  );
}
