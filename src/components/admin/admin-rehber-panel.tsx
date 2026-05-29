"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Contact,
  Plus,
  Search,
  ChevronDown,
  Calendar,
  Phone,
  MapPin,
  Trash2,
  Pencil,
} from "lucide-react";
import type { RehberContact } from "@/types/reservations";
import { Input } from "@/components/ui/input";
import { RehberEditDialog } from "@/components/admin/rehber-edit-dialog";
import {
  AdminPanelHeader,
  AdminEmptyState,
} from "@/components/admin/admin-panel-header";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { notifyAdminDataChanged } from "@/lib/admin-data-sync";

export function AdminRehberPanel() {
  const [contacts, setContacts] = useState<RehberContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [editContact, setEditContact] = useState<RehberContact | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
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
    setShowForm(false);
    load();
    notifyAdminDataChanged();
  };

  const remove = async (id: string) => {
    if (!confirm("Bu kaydı silmek istiyor musunuz?")) return;
    await fetch(`/api/admin/rehber?id=${id}`, { method: "DELETE" });
    load();
    notifyAdminDataChanged();
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter((c) => {
      const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
      return (
        name.includes(q) ||
        (c.phone ?? "").toLowerCase().includes(q) ||
        (c.shootingLocation ?? "").toLowerCase().includes(q)
      );
    });
  }, [contacts, search]);

  const fromReservation = contacts.filter((c) => c.source === "reservation").length;
  const manual = contacts.length - fromReservation;

  if (loading) {
    return (
      <div className="space-y-4">
        <AdminPanelHeader eyebrow="Rehber" title="Çift iletişimleri" icon={Contact} />
        <div className="h-48 animate-pulse rounded-2xl border border-white/8 bg-rm-black-elevated/40" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Rehber"
        title="Çift iletişimleri"
        description="Tüm onaylı rezervasyonlar otomatik düşer; manuel eklemeler de aynı listede saklanır."
        icon={Contact}
        meta={`${contacts.length} kayıt · ${fromReservation} rezervasyondan · ${manual} manuel`}
        actions={
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2.5 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase shadow-[0_6px_22px_rgba(196,160,82,0.3)] transition-all hover:-translate-y-0.5 hover:bg-rm-champagne-light"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            {showForm ? "Formu kapat" : "Manuel ekle"}
          </button>
        }
      />

      {showForm && (
        <form
          onSubmit={addManual}
          className="overflow-hidden rounded-2xl border border-rm-champagne/25 bg-rm-champagne/[0.04] p-6"
        >
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-8 rounded-full bg-rm-champagne" />
            <h3 className="text-[10px] font-bold tracking-[0.3em] text-rm-champagne uppercase">
              Yeni kişi
            </h3>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <Input
              placeholder="Ad"
              value={form.firstName}
              onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
            />
            <Input
              placeholder="Soyad"
              value={form.lastName}
              onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
            />
            <Input
              placeholder="Telefon *"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-white/[0.03] sm:col-span-2"
              required
            />
            <Input
              type="date"
              value={form.weddingDate}
              onChange={(e) => setForm((f) => ({ ...f, weddingDate: e.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
            />
            <Input
              placeholder="Çekim alanı"
              value={form.shootingLocation}
              onChange={(e) =>
                setForm((f) => ({ ...f, shootingLocation: e.target.value }))
              }
              className="h-11 rounded-xl border-white/10 bg-white/[0.03]"
            />
            <Input
              placeholder="Not"
              value={form.note}
              onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))}
              className="h-11 rounded-xl border-white/10 bg-white/[0.03] sm:col-span-2"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-full bg-rm-champagne px-6 py-2.5 text-[11px] font-bold tracking-[0.18em] text-rm-black uppercase transition-colors hover:bg-rm-champagne-light"
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Kayıt ekle
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-5 py-2.5 text-[11px] font-semibold tracking-[0.18em] text-rm-gray-400 uppercase transition-colors hover:border-white/30 hover:text-rm-off-white"
            >
              Vazgeç
            </button>
          </div>
        </form>
      )}

      <div className="relative">
        <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-rm-gray-500" />
        <Input
          placeholder="Ad, telefon veya çekim alanı ile ara…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-11 placeholder:text-rm-gray-500"
        />
      </div>

      {filtered.length === 0 ? (
        contacts.length === 0 ? (
          <AdminEmptyState
            icon={Contact}
            title="Henüz kayıt yok"
            description="Manuel kayıt eklemek için yukarıdaki butonu kullanın. Rezervasyon oluşturduğunuzda da otomatik olarak buraya düşer."
          />
        ) : (
          <AdminEmptyState
            icon={Search}
            title="Eşleşen kayıt yok"
            description={`"${search}" için sonuç bulunamadı.`}
          />
        )
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((c) => (
            <li
              key={c.id}
              className="group overflow-hidden rounded-2xl border border-white/8 bg-rm-black-elevated/60 px-5 py-4 transition-all hover:-translate-y-0.5 hover:border-rm-champagne/25 hover:bg-rm-black-elevated"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-editorial text-lg text-rm-off-white">
                      {c.firstName} {c.lastName}
                    </p>
                    <span
                      className={
                        c.source === "reservation"
                          ? "rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold tracking-[0.18em] text-emerald-300 uppercase"
                          : "rounded-full border border-white/15 bg-white/[0.04] px-2 py-0.5 text-[9px] font-bold tracking-[0.18em] text-rm-gray-400 uppercase"
                      }
                    >
                      {c.source === "reservation" ? "Rezervasyon" : "Manuel"}
                    </span>
                  </div>
                  <p className="mt-1.5 flex items-center gap-1.5 text-sm text-rm-gray-300">
                    <Phone className="h-3.5 w-3.5 text-rm-champagne/70" strokeWidth={1.6} />
                    {c.phone || "—"}
                    {c.weddingDate && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs text-rm-gray-500">
                        <Calendar className="h-3 w-3" strokeWidth={1.6} />
                        {c.weddingDate}
                      </span>
                    )}
                  </p>
                  {c.shootingLocation && (
                    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-rm-gray-500">
                      <MapPin className="h-3 w-3" strokeWidth={1.6} />
                      {c.shootingLocation}
                    </p>
                  )}
                  {c.shootingNote && (
                    <p className="mt-0.5 text-xs text-rm-gray-500">{c.shootingNote}</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditContact(c)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-rm-off-white uppercase transition-colors hover:border-rm-champagne/40 hover:text-rm-champagne"
                  >
                    <Pencil className="h-3 w-3" strokeWidth={1.8} />
                    Düzenle
                  </button>
                  {c.reservationId && (
                    <a
                      href={`/admin?tab=calendar&res=${c.reservationId}`}
                      className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-emerald-300 uppercase transition-colors hover:bg-emerald-500/10"
                    >
                      <Calendar className="h-3 w-3" strokeWidth={1.8} />
                      Takvim
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(c.id)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 px-3 py-1.5 text-[10px] font-bold tracking-[0.18em] text-red-300 uppercase transition-colors hover:bg-red-500/10"
                  >
                    <Trash2 className="h-3 w-3" strokeWidth={1.8} />
                    Sil
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <RehberEditDialog
        contact={editContact}
        open={Boolean(editContact)}
        onOpenChange={(o) => !o && setEditContact(null)}
        onSaved={load}
      />
    </div>
  );
}
