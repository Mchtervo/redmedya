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
    <div className="space-y-6">
      <form
        onSubmit={addManual}
        className="rounded-xl border border-white/8 bg-rm-black-elevated/60 p-6"
      >
        <div className="flex items-center gap-2">
          <span className="h-1 w-8 rounded-full bg-rm-champagne" />
          <h3 className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase">
            Manuel kişi ekle
          </h3>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Input
            placeholder="Ad"
            value={form.firstName}
            onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
            className="h-11 rounded-lg border-white/10 bg-white/[0.03]"
          />
          <Input
            placeholder="Soyad"
            value={form.lastName}
            onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
            className="h-11 rounded-lg border-white/10 bg-white/[0.03]"
          />
          <Input
            placeholder="Telefon *"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="h-11 rounded-lg border-white/10 bg-white/[0.03] sm:col-span-2"
            required
          />
          <Input
            type="date"
            value={form.weddingDate}
            onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
            className="h-11 rounded-lg border-white/10 bg-white/[0.03]"
          />
          <Input
            placeholder="Çekim alanı"
            value={form.shootingLocation}
            onChange={(e) =>
              setForm((f) => ({ ...f, shootingLocation: e.target.value }))
            }
            className="h-11 rounded-lg border-white/10 bg-white/[0.03]"
          />
          <Input
            placeholder="Not"
            value={form.note}
            onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
            className="h-11 rounded-lg border-white/10 bg-white/[0.03] sm:col-span-2"
          />
        </div>
        <button
          type="submit"
          className="mt-5 rounded-full bg-rm-champagne px-6 py-2.5 text-[11px] font-bold tracking-[0.15em] text-rm-black uppercase transition-colors hover:bg-rm-champagne-light"
        >
          Kayıt ekle →
        </button>
      </form>

      <div className="flex items-center justify-between rounded-xl border border-white/8 bg-rm-black-elevated/40 px-4 py-3">
        <p className="text-sm text-rm-gray-400">
          <span className="font-semibold text-rm-champagne">{contacts.length}</span>{" "}
          kişi · rezervasyonlar otomatik senkron
        </p>
      </div>

      <ul className="space-y-2.5">
        {contacts.map((c) => (
          <li
            key={c.id}
            className="group rounded-xl border border-white/8 bg-rm-black-elevated/60 px-5 py-4 transition-all hover:border-rm-champagne/25 hover:bg-rm-black-elevated"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium text-rm-off-white">
                    {c.firstName} {c.lastName}
                  </p>
                  <span
                    className={
                      c.source === "reservation"
                        ? "rounded-full border border-emerald-500/30 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-emerald-300 uppercase"
                        : "rounded-full border border-white/15 px-2 py-0.5 text-[9px] font-semibold tracking-wider text-rm-gray-500 uppercase"
                    }
                  >
                    {c.source === "reservation" ? "Rezervasyon" : "Manuel"}
                  </span>
                </div>
                <p className="mt-1 text-sm text-rm-gray-400">
                  {c.phone}
                  {c.weddingDate && (
                    <span className="text-rm-gray-500"> · {c.weddingDate}</span>
                  )}
                </p>
                {c.shootingLocation && (
                  <p className="mt-1.5 text-xs text-rm-gray-500">
                    📍 {c.shootingLocation}
                  </p>
                )}
                {c.shootingNote && (
                  <p className="text-xs text-rm-gray-500">{c.shootingNote}</p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditContact(c)}
                  className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-rm-off-white uppercase transition-colors hover:border-rm-champagne/40 hover:text-rm-champagne"
                >
                  Düzenle
                </button>
                {c.reservationId && (
                  <a
                    href={`/admin?tab=calendar&res=${c.reservationId}`}
                    className="rounded-full border border-emerald-500/25 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-emerald-300 uppercase transition-colors hover:bg-emerald-500/10"
                  >
                    Takvim
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => remove(c.id)}
                  className="rounded-full border border-red-500/25 px-3 py-1.5 text-[10px] font-semibold tracking-wider text-red-300 uppercase transition-colors hover:bg-red-500/10"
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
