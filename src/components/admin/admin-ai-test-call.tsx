"use client";

/**
 * 🧪 Test araması: numarayı yaz → sesli asistan hemen arar. Görüşme hiçbir çiftin kaydına
 * yazılmaz, WhatsApp gitmez. Ses kaydı, konuşma metni ve özet burada dinlenir/okunur.
 */
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, FlaskConical, Phone, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaveAudio } from "@/components/admin/admin-wave-audio";

type TestCall = {
  id: string;
  phone: string;
  name: string;
  weddingDate?: string;
  at: string;
  status?: string;
  durationSec?: number;
  summary?: string;
  sonuc?: string;
  transcript?: { role: "agent" | "user"; text: string; at?: number }[];
};

const STATUS: Record<string, { text: string; cls: string }> = {
  initiated: { text: "Aranıyor…", cls: "bg-amber-50 text-amber-800" },
  "in-progress": { text: "Görüşme sürüyor", cls: "bg-indigo-50 text-indigo-700" },
  processing: { text: "Kayıt hazırlanıyor", cls: "bg-indigo-50 text-indigo-700" },
  done: { text: "Bitti", cls: "bg-emerald-50 text-emerald-700" },
  failed: { text: "Bağlanamadı", cls: "bg-rose-50 text-rose-700" },
};

const field =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300";

function fmt(iso: string) {
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AdminTestCallBox() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<{ ok: boolean; text: string } | null>(null);
  const [calls, setCalls] = useState<TestCall[] | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/ai-test-call", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { calls: [] }))
      .then((j: { calls?: TestCall[] }) => setCalls(j.calls ?? []))
      .catch(() => setCalls([]));
  }, []);

  useEffect(() => {
    if (!open) return;
    load();
  }, [open, load]);

  // Devam eden görüşme varsa 10 sn'de bir yenile
  const live = (calls ?? []).some((c) => !c.status || ["initiated", "in-progress", "processing"].includes(c.status));
  useEffect(() => {
    if (!open || !live) return;
    const t = setInterval(load, 10_000);
    return () => clearInterval(t);
  }, [open, live, load]);

  const start = async () => {
    if (!confirm(`${phone} numarası şimdi sesli asistanla TEST amaçlı aransın mı?`)) return;
    setBusy(true);
    setInfo({ ok: true, text: "Arama başlatılıyor…" });
    const res = await fetch("/api/admin/ai-test-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, name, weddingDate: date }),
    });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    setInfo(res.ok ? { ok: true, text: "📞 Arıyor — telefonunuzu açın. Görüşme bitince kayıt ve metin aşağıda çıkar." } : { ok: false, text: `⚠️ ${j.error ?? "Arama başlatılamadı"}` });
    if (res.ok) load();
  };

  return (
    <section className="rm-card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <FlaskConical className="h-[18px] w-[18px]" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">🧪 Test araması</span>
            <span className="block text-xs text-slate-500">Bir numara yaz, asistan hemen arasın. Kaydı ve konuşmayı burada dinle — çiftlere yazılmaz.</span>
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-[1.2fr_1fr_0.9fr_auto]">
            <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" placeholder="Numara (05xx xxx xx xx)" className={field} />
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Hitap edilecek isim (ops.)" className={field} />
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={field} title="Düğün tarihi (ops.)" />
            <button
              type="button"
              disabled={busy || phone.replace(/\D/g, "").length < 10}
              onClick={start}
              className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-violet-600 px-4 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(124,58,237,0.8)] transition-colors hover:bg-violet-700 disabled:opacity-40"
            >
              <Phone className="h-4 w-4" /> Test et
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            İsim boşsa asistan isimsiz hitap eder. Tarih girersen takvimden o tarihi kontrol eder; boşsa tarihi sana sorar. Saat sınırı yoktur.
          </p>
          {info && (
            <p className={cn("rounded-xl border px-3 py-2 text-sm", info.ok ? "border-violet-100 bg-violet-50 text-violet-800" : "border-rose-200 bg-rose-50 text-rose-800")}>{info.text}</p>
          )}

          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Son test aramaları</p>
            <button type="button" onClick={load} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
              <RefreshCw className={cn("h-3 w-3", live && "animate-spin")} /> Yenile
            </button>
          </div>
          {calls === null ? (
            <div className="h-16 animate-pulse rounded-2xl bg-slate-100" />
          ) : calls.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-4 text-center text-sm text-slate-500">Henüz test araması yok.</p>
          ) : (
            <ul className="space-y-2.5">
              {calls.map((c) => {
                const st = STATUS[c.status ?? "initiated"] ?? { text: c.status ?? "—", cls: "bg-slate-100 text-slate-600" };
                const isOpen = expanded === c.id;
                return (
                  <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                    <button type="button" onClick={() => setExpanded(isOpen ? null : c.id)} className="flex w-full flex-wrap items-center gap-x-3 gap-y-1 text-left">
                      <span className="text-sm font-semibold text-slate-900 tabular-nums">{c.phone.replace(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4")}</span>
                      <span className="text-xs text-slate-500">{c.name} · {fmt(c.at)}</span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", st.cls)}>{st.text}</span>
                      {c.durationSec ? <span className="text-xs text-slate-500">{Math.floor(c.durationSec / 60)} dk {c.durationSec % 60} sn</span> : null}
                      {c.sonuc && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">sonuç: {c.sonuc}</span>}
                      <ChevronDown className={cn("ml-auto h-4 w-4 text-slate-400 transition-transform", isOpen && "rotate-180")} />
                    </button>
                    {c.summary && <p className="mt-2 text-sm leading-relaxed text-slate-700">{c.summary}</p>}
                    {c.status === "done" && <WaveAudio src={`/api/admin/ai-recording/${c.id}`} seed={c.id} />}
                    {isOpen && (c.transcript?.length ?? 0) > 0 && (
                      <ul className="mt-3 max-h-96 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-3">
                        {c.transcript!.map((t, i) => (
                          <li key={i} className={cn("max-w-[88%] rounded-2xl px-3 py-1.5 text-sm", t.role === "agent" ? "bg-indigo-600 text-white" : "ml-auto bg-white text-slate-900 shadow-sm")}>
                            <span className="block text-[10px] opacity-70">{t.role === "agent" ? "Asistan" : "Karşı taraf"}{typeof t.at === "number" ? ` · ${Math.floor(t.at / 60)}:${String(t.at % 60).padStart(2, "0")}` : ""}</span>
                            {t.text}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}
