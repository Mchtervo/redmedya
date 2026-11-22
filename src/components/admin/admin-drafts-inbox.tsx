"use client";

/**
 * Cevap bekleyenler · Önerilen cevaplar — Telegram'daki "✅ Gönder" önerilerinin panel karşılığı.
 * Panelden gönderilince Telegram'daki düğme kalkar ("Panelden gönderildi"); Telegram'dan gönderilince buradan düşer.
 * Metin düzenlenip gönderilebilir (asistan farktan ders çıkarır).
 */
import { useCallback, useEffect, useState } from "react";
import { Check, Inbox, Loader2, RefreshCw, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Draft = {
  id: string;
  channel: "whatsapp" | "instagram";
  coupleId?: string;
  name: string;
  phone?: string;
  username?: string;
  text: string;
  createdAt: string;
  summary?: string;
  customer: { at: string; text: string }[];
  expiresAt: string;
};
type Waiting = { id: string; name: string; phone: string; at: string; text: string; channel: string; summary: string | null };

const ago = (iso: string) => {
  const m = Math.round((Date.now() - Date.parse(iso)) / 60000);
  if (m < 1) return "az önce";
  if (m < 60) return `${m} dk önce`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} sa önce` : `${Math.round(h / 24)} gün önce`;
};
const phoneText = (p?: string) => (p ? p.replace(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4") : "");

function DraftCard({ d, now, onDone }: { d: Draft; now: number; onDone: (id: string, msg: string, ok: boolean) => void }) {
  const [text, setText] = useState(d.text);
  const [busy, setBusy] = useState<"send" | "cancel" | null>(null);
  const edited = text.trim() !== d.text.trim();
  const act = async (action: "send" | "cancel") => {
    if (action === "send" && !text.trim()) return;
    setBusy(action);
    const r = await fetch(`/api/admin/drafts/${d.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, text: edited ? text : undefined }) })
      .then((x) => x.json())
      .catch(() => ({ ok: false, msg: "Bağlantı hatası" }));
    setBusy(null);
    onDone(d.id, r.msg ?? (r.ok ? "Tamam" : "Hata"), Boolean(r.ok));
  };
  const hoursLeft = Math.max(0, Math.round((Date.parse(d.expiresAt) - now) / 3600_000));
  return (
    <li className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-bold", d.channel === "instagram" ? "bg-pink-100 text-pink-800" : "bg-emerald-100 text-emerald-800")}>
          {d.channel === "instagram" ? "Instagram" : "WhatsApp"}
        </span>
        <span className="text-sm font-semibold text-slate-900">{d.name}</span>
        <span className="text-xs text-slate-500">{d.channel === "instagram" ? (d.username ? `@${d.username}` : "") : phoneText(d.phone)}</span>
        <span className="ml-auto text-[11px] text-slate-400">{ago(d.createdAt)}{d.channel === "instagram" && hoursLeft <= 6 ? ` · ${hoursLeft} sa içinde gönderin` : ""}</span>
      </div>
      {d.summary && <p className="mt-1.5 text-xs text-indigo-900"><span className="font-semibold">📍</span> {d.summary}</p>}
      {d.customer.length > 0 && (
        <div className="mt-2 space-y-1 rounded-xl bg-rose-50/70 px-3 py-2">
          {d.customer.map((m, i) => (
            <p key={i} className="text-sm text-rose-900">💬 {m.text}</p>
          ))}
        </div>
      )}
      <label className="mt-2 block text-[11px] font-semibold text-slate-500">
        Önerilen cevap {edited && <span className="text-amber-600">(düzenlendi)</span>}
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={Math.min(8, Math.max(3, Math.ceil(text.length / 70)))}
          className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-300 focus:bg-white"
        />
      </label>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={!!busy || !text.trim()}
          onClick={() => act("send")}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
        >
          {busy === "send" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Gönder
        </button>
        <button
          type="button"
          disabled={!!busy}
          onClick={() => act("cancel")}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy === "cancel" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />} Gönderme
        </button>
      </div>
    </li>
  );
}

export function AdminDraftsInbox() {
  const [drafts, setDrafts] = useState<Draft[] | null>(null);
  const [waiting, setWaiting] = useState<Waiting[]>([]);
  const [note, setNote] = useState<{ msg: string; ok: boolean } | null>(null);
  const [now, setNow] = useState(0);
  const load = useCallback(() => {
    fetch("/api/admin/drafts", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((j: { drafts?: Draft[]; waiting?: Waiting[] }) => {
        setDrafts(j.drafts ?? []);
        setWaiting(j.waiting ?? []);
        setNow(Date.now());
      })
      .catch(() => setDrafts((d) => d ?? []));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(() => document.visibilityState === "visible" && load(), 30_000);
    return () => clearInterval(t);
  }, [load]);
  const onDone = (id: string, msg: string, ok: boolean) => {
    setNote({ msg, ok });
    if (ok) setDrafts((d) => (d ?? []).filter((x) => x.id !== id));
    else load();
    setTimeout(() => setNote(null), 6000);
  };

  if (drafts === null) return null;
  const total = drafts.length + waiting.length;
  if (!total && !note) return null;

  return (
    <section className="rm-card overflow-hidden border-2 border-indigo-200">
      <div className="flex items-center justify-between gap-3 bg-indigo-50/70 px-4 py-3 sm:px-5">
        <span className="flex items-center gap-2.5">
          <Inbox className="size-5 text-indigo-600" aria-hidden />
          <span>
            <span className="block text-sm font-bold text-slate-900">Cevap bekleyenler · Önerilen cevaplar</span>
            <span className="block text-xs text-slate-600">
              {drafts.length} öneri onayınızı bekliyor{waiting.length ? ` · ${waiting.length} müşteri önerisiz cevap bekliyor` : ""} — Telegram&apos;dan ya da buradan gönderebilirsiniz
            </span>
          </span>
        </span>
        <button type="button" onClick={load} aria-label="Yenile" className="grid size-9 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-800">
          <RefreshCw className="size-4" />
        </button>
      </div>
      {note && <p className={cn("px-4 py-2 text-sm font-medium sm:px-5", note.ok ? "bg-emerald-50 text-emerald-800" : "bg-rose-50 text-rose-800")}>{note.msg}</p>}
      {drafts.length > 0 && (
        <ul className="grid gap-3 p-4 sm:px-5 lg:grid-cols-2">
          {drafts.map((d) => (
            <DraftCard key={d.id} d={d} now={now} onDone={onDone} />
          ))}
        </ul>
      )}
      {waiting.length > 0 && (
        <div className="border-t border-slate-100 px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold text-slate-600">Önerisi olmayan, cevap bekleyen müşteriler (siz dönün):</p>
          <ul className="mt-2 divide-y divide-slate-100">
            {waiting.map((w) => (
              <li key={w.id} className="py-2 text-sm">
                <span className="font-semibold text-slate-900">{w.name}</span> <span className="text-xs text-slate-500">{phoneText(w.phone)} · {ago(w.at)}</span>
                <p className="line-clamp-2 text-rose-800">💬 {w.text}</p>
                {w.summary && <p className="text-xs text-indigo-900">📍 {w.summary}</p>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
