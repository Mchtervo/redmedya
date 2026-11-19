"use client";

/**
 * 🎭 Şaka araması: sahibinin YAKINLARINA eğlence amaçlı. Ayrı sesli asistan arar (müşteri asistanı değil);
 * çift kaydı açmaz, WhatsApp göndermez, sayılara girmez. Kayıt ve konuşma burada dinlenir/okunur.
 */
import { useCallback, useEffect, useState } from "react";
import { ChevronDown, Drama, Phone, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { WaveAudio } from "@/components/admin/admin-wave-audio";
import { AdminPanelHeader } from "@/components/admin/admin-panel-header";

type Prank = {
  id: string; phone: string; name: string; mode: string; duration: string; topic?: string; at: string;
  status?: string; durationSec?: number; transcript?: { role: "agent" | "user"; text: string; at?: number }[];
};

const MODES: [string, string, string][] = [
  ["esprili", "😄 Esprili", "Hafif takılır, espri yapar"],
  ["ciddi", "🧐 Ciddi", "Resmî tonla saçma bir konu"],
  ["makara", "🤣 Makara", "Tam gırgır, kahkahalı"],
];
const DURS: [string, string][] = [["kısa", "Kısa (~1 dk)"], ["normal", "Normal (2-3 dk)"], ["uzun", "Uzun (5 dk)"]];
const field = "h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-fuchsia-300";
const fmt = (iso: string) => new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

/** Ayrı sayfa: menü → Eğlence → Şaka Araması */
export function AdminPrankPanel() {
  return (
    <div className="space-y-5">
      <AdminPanelHeader eyebrow="Eğlence" title="Şaka Araması" icon={Drama} description="Sadece yakınlarınız için. Müşteri sistemiyle hiçbir bağlantısı yok: ayrı asistan arar, çift kaydı açılmaz, WhatsApp gitmez, sayılara girmez." />
      <AdminPrankCallBox defaultOpen />
    </div>
  );
}

export function AdminPrankCallBox({ defaultOpen = false }: { defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [mode, setMode] = useState("esprili");
  const [duration, setDuration] = useState("normal");
  const [topic, setTopic] = useState("");
  const [person, setPerson] = useState("");
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState<{ ok: boolean; text: string } | null>(null);
  const [data, setData] = useState<{ calls: Prank[]; today: number; limit: number } | null>(null);
  const [shown, setShown] = useState<Record<string, boolean>>({});
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(() => {
    fetch("/api/admin/ai-prank-call", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { calls?: Prank[]; today?: number; limit?: number } | null) => {
        if (!j) return;
        setData({ calls: j.calls ?? [], today: j.today ?? 0, limit: j.limit ?? 10 });
        setLoadedAt(Date.now());
      })
      .catch(() => null);
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const live = (data?.calls ?? []).some((c) => loadedAt - Date.parse(c.at) < 12 * 60_000 && (!c.status || ["initiated", "in-progress", "processing"].includes(c.status)));
  useEffect(() => {
    if (!open || !live) return;
    const t = setInterval(load, 4_000);
    return () => clearInterval(t);
  }, [open, live, load]);

  const start = async () => {
    setBusy(true);
    setInfo({ ok: true, text: "📞 Aranıyor… telefon 20-40 saniye içinde çalar." });
    const res = await fetch("/api/admin/ai-prank-call", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ phone, name, mode, duration, topic, info: person }) }).catch(() => null);
    setBusy(false);
    if (!res) return setInfo({ ok: false, text: "⚠️ Bağlantı hatası — tekrar deneyin" });
    const j = (await res.json().catch(() => ({}))) as { error?: string };
    setInfo(res.ok ? { ok: true, text: "🎭 Arıyor. Görüşme bitince kayıt ve konuşma aşağıda çıkar." } : { ok: false, text: `⚠️ ${j.error ?? "Arama başlatılamadı"}` });
    if (res.ok) load();
  };

  return (
    <section className="rm-card overflow-hidden">
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left sm:px-5">
        <span className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-fuchsia-50 text-fuchsia-600">
            <Drama className="h-[18px] w-[18px]" />
          </span>
          <span>
            <span className="block text-sm font-semibold text-slate-900">🎭 Şaka araması (yakınlara)</span>
            <span className="block text-xs text-slate-500">Ayrı asistan arar — müşteri sistemiyle bağlantısı yok. WhatsApp gitmez, sayılmaz.</span>
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-4 border-t border-slate-100 p-4 sm:p-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="rm-saka-tel" autoComplete="off" data-lpignore="true" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Numara (05xx xxx xx xx)" className={field} />
            <input name="rm-saka-isim" autoComplete="off" data-lpignore="true" value={name} onChange={(e) => setName(e.target.value)} placeholder="İsim — örn. Ömer" className={field} />
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Mod</p>
            <div className="grid gap-2 sm:grid-cols-3">
              {MODES.map(([k, l, d]) => (
                <button key={k} type="button" onClick={() => setMode(k)} className={cn("rounded-xl border px-3 py-2.5 text-left transition-colors", mode === k ? "border-fuchsia-400 bg-fuchsia-50" : "border-slate-200 bg-white hover:border-fuchsia-200")}>
                  <span className="block text-sm font-semibold text-slate-900">{l}</span>
                  <span className="block text-xs text-slate-500">{d}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Süre</p>
            <div className="flex flex-wrap gap-2">
              {DURS.map(([k, l]) => (
                <button key={k} type="button" onClick={() => setDuration(k)} className={cn("h-10 rounded-xl border px-3 text-sm font-medium", duration === k ? "border-fuchsia-400 bg-fuchsia-50 text-fuchsia-800" : "border-slate-200 bg-white text-slate-600")}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Senaryo — ne yapsın?</span>
            <textarea
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              rows={2}
              maxLength={800}
              placeholder="örn. “Yan komşusu Ayşe Hanım adına ara, gece geç saatte yüksek sesle türkü söylediği için şikâyet et.” · Boş bırakırsan asistan kendisi uydurur."
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-fuchsia-300"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Kişi hakkında bilgiler — espri malzemesi</span>
            <textarea
              value={person}
              onChange={(e) => setPerson(e.target.value)}
              rows={4}
              maxLength={1200}
              placeholder="örn. “Fenerbahçeli, maç kaybedince küser. Çiğ köfteye bayılır. Sabahları kalkamaz. Kedisinin adı Paşa. Komşusu Ayşe Hanım. Arabasını hep yanlış park eder.”"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-fuchsia-300"
            />
            <span className="mt-1 block text-[11px] text-slate-500">Asistan bu bilgileri esprilerine serpiştirir; seçtiğin moda göre tatlı, ciddi ya da gırgır kullanır.</span>
          </label>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={busy || phone.replace(/\D/g, "").length < 10}
              onClick={start}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-xl bg-fuchsia-600 px-5 text-sm font-semibold text-white shadow-[0_8px_18px_-8px_rgba(192,38,211,0.8)] hover:bg-fuchsia-700 disabled:opacity-40"
            >
              <Phone className="h-4 w-4" /> Şaka yap
            </button>
            {data && <span className="text-xs text-slate-500">Bugün {data.today}/{data.limit}</span>}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">
            Sadece yakınlarınız için. Müşteri kaydı olan numara aranmaz. Asistan gerçek kurum (polis, banka, hastane…) taklidi yapmaz, korkutucu konu açmaz; karşı taraf gerçekten telaşlanırsa şaka olduğunu söyler.
          </p>
          {info && <p className={cn("rounded-xl border px-3 py-2 text-sm", info.ok ? "border-fuchsia-100 bg-fuchsia-50 text-fuchsia-800" : "border-rose-200 bg-rose-50 text-rose-800")}>{info.text}</p>}

          {data && data.calls.length > 0 && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Son şaka aramaları</p>
                <button type="button" onClick={load} className="inline-flex items-center gap-1 text-xs font-semibold text-fuchsia-700 hover:underline">
                  <RefreshCw className={cn("h-3 w-3", live && "animate-spin")} /> Yenile
                </button>
              </div>
              <ul className="space-y-2.5">
                {data.calls.map((c) => {
                  const spoke = (c.transcript ?? []).some((x) => x.role === "user");
                  const liveNow = !c.status || ["initiated", "in-progress", "processing"].includes(c.status);
                  const st = liveNow ? "📞 Sürüyor…" : spoke ? "✅ Konuşuldu" : "📵 Açılmadı";
                  const isOpen = shown[c.id] ?? false;
                  return (
                    <li key={c.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                      <div role="button" tabIndex={0} onClick={() => setShown((s) => ({ ...s, [c.id]: !isOpen }))} onKeyDown={(e) => e.key === "Enter" && setShown((s) => ({ ...s, [c.id]: !isOpen }))} className="flex cursor-pointer flex-wrap items-center gap-x-3 gap-y-1 select-none">
                        <span className="text-sm font-semibold text-slate-900 tabular-nums">{c.phone.replace(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/, "0$1 $2 $3 $4")}</span>
                        <span className="text-xs text-slate-500">{c.name} · {c.mode} · {fmt(c.at)}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">{st}</span>
                        {c.durationSec ? <span className="text-xs text-slate-500">{Math.floor(c.durationSec / 60)} dk {c.durationSec % 60} sn</span> : null}
                        <span className="ml-auto inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold text-fuchsia-700">
                          {isOpen ? "Kapat" : "Dinle / oku"} <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", isOpen && "rotate-180")} />
                        </span>
                      </div>
                      {isOpen && c.status === "done" && spoke && <WaveAudio src={`/api/admin/ai-recording/${c.id}`} seed={c.id} />}
                      {isOpen && (c.transcript?.length ?? 0) > 0 && (
                        <ul className="mt-3 max-h-96 space-y-1.5 overflow-y-auto rounded-xl bg-slate-50 p-3">
                          {c.transcript!.map((t, i) => (
                            <li key={i} className={cn("max-w-[88%] rounded-2xl px-3 py-1.5 text-sm break-words", t.role === "agent" ? "bg-fuchsia-600 text-white" : "ml-auto bg-white text-slate-900 shadow-sm")}>
                              <span className="block text-[10px] opacity-70">{t.role === "agent" ? "Asistan" : "Karşı taraf"}</span>
                              {t.text}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
