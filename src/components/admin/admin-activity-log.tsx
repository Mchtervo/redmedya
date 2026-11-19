"use client";

/**
 * Hareketler: tüm çiftlerin (ve test aramalarının) hareketleri saat sırasıyla.
 * Arama (açtı/açmadı, süre, özet), giden/gelen mesajlar, meşgul, geri arama, kara liste, rezervasyon…
 * Aramalarda "Detay" → ses kaydı + konuşma metni + notlar. 30 sn'de bir yenilenir. Sadece okuma.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Activity, FlaskConical, MessageCircle, Phone, PhoneOff, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminPanelHeader } from "@/components/admin/admin-panel-header";
import { WaveAudio } from "@/components/admin/admin-wave-audio";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import type { AiCallRecord, AiCouple, AiMessageRecord } from "@/types/ai-couples";
import { displayPhone, GRADE_LABEL, OUTCOME_LABEL } from "@/lib/ai-couples/rules";
import { nextStep } from "@/lib/ai-couples/journey";

type TestCall = {
  id: string; phone: string; name: string; at: string; status?: string; durationSec?: number; summary?: string; sonuc?: string;
  transcript?: { role: "agent" | "user"; text: string; at?: number }[];
};

type Kind = "call" | "message" | "system";
type Ev = {
  key: string;
  at: string;
  kind: Kind;
  icon: "call" | "noanswer" | "msg-in" | "msg-out" | "test" | "system";
  title: string;
  text?: string;
  couple?: AiCouple;
  call?: AiCallRecord;
  msg?: AiMessageRecord;
  test?: TestCall;
  tone: "green" | "orange" | "blue" | "rose" | "slate" | "violet";
};

const SRC: Record<string, string> = { dugun_com: "Düğün.com", meta_form: "Instagram/Facebook", web: "Web", manual: "Elle" };
const CH: Record<string, string> = { whatsapp: "WhatsApp", sms: "SMS", dugun_com: "Düğün.com", telegram: "Telegram" };
const TONE: Record<Ev["tone"], string> = {
  green: "bg-emerald-50 text-emerald-600",
  orange: "bg-orange-50 text-orange-600",
  blue: "bg-indigo-50 text-indigo-600",
  rose: "bg-rose-50 text-rose-600",
  slate: "bg-slate-100 text-slate-500",
  violet: "bg-violet-50 text-violet-600",
};

function hhmm(iso: string) {
  return new Date(iso).toLocaleTimeString("tr-TR", { timeZone: "Europe/Istanbul", hour: "2-digit", minute: "2-digit" });
}
function dayHeader(iso: string) {
  const d = new Date(iso).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  const yest = new Date(Date.now() - 86_400_000).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  if (d === today) return "Bugün";
  if (d === yest) return "Dün";
  return new Date(iso).toLocaleDateString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long" });
}
const dur = (s?: number) => (s ? `${Math.floor(s / 60)} dk ${s % 60} sn` : "");

/** Zaman çizelgesinin, aramalarla/mesajlarla tekrar etmeyen olayları */
const SYSTEM_TYPES: Record<string, { title: string; tone: Ev["tone"] }> = {
  created: { title: "Yeni talep geldi", tone: "blue" },
  duplicate: { title: "Tekrar başvurdu", tone: "blue" },
  busy: { title: "Hat meşgul", tone: "orange" },
  callback: { title: "Tekrar arama zamanı ayarlandı", tone: "blue" },
  thinking: { title: "Düşünüyor olarak işaretlendi", tone: "orange" },
  follow_up: { title: "Takip", tone: "blue" },
  locked: { title: "Kara listeye alındı", tone: "rose" },
  unlocked: { title: "Kilit açıldı", tone: "slate" },
  lost: { title: "İlgilenmiyor", tone: "slate" },
  won: { title: "💍 Rezervasyon yaptı", tone: "green" },
  violation: { title: "Uyarı", tone: "rose" },
  edit: { title: "Bilgi güncellendi", tone: "slate" },
};

export function AdminActivityLog() {
  const [couples, setCouples] = useState<AiCouple[] | null>(null);
  const [tests, setTests] = useState<TestCall[]>([]);
  const [kind, setKind] = useState<Kind | "all">("all");
  const [q, setQ] = useState("");
  const [limit, setLimit] = useState(150);
  const [open, setOpen] = useState<Ev | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/ai-couples", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { couples: [] }))
      .then((j: { couples?: AiCouple[] }) => setCouples(j.couples ?? []))
      .catch(() => setCouples([]));
    fetch("/api/admin/ai-test-call", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { calls: [] }))
      .then((j: { calls?: TestCall[] }) => setTests(j.calls ?? []))
      .catch(() => setTests([]));
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 30_000);
    return () => clearInterval(t);
  }, [load]);
  useAdminDataSync(load);

  const events = useMemo(() => {
    const out: Ev[] = [];
    for (const c of couples ?? []) {
      for (const call of c.calls) {
        const answered = call.outcome !== "no_answer";
        out.push({
          key: `c-${call.id}`, at: call.at, kind: "call", couple: c, call,
          icon: answered ? "call" : "noanswer", tone: answered ? "green" : "orange",
          title: answered ? `Arandı — açtı · ${OUTCOME_LABEL[call.outcome]}` : "Arandı — açmadı",
          text: call.summary?.split("\n")[0],
        });
      }
      for (const m of c.messages) {
        out.push({
          key: `m-${m.id}`, at: m.at, kind: "message", couple: c, msg: m,
          icon: m.direction === "in" ? "msg-in" : "msg-out", tone: m.direction === "in" ? "rose" : "blue",
          title: m.direction === "in" ? `Çift yazdı (${CH[m.channel] ?? m.channel})` : `${CH[m.channel] ?? m.channel} mesajı gönderildi`,
          text: m.text.replace(/\s+/g, " ").slice(0, 180),
        });
      }
      for (const [i, e] of c.timeline.entries()) {
        const s = SYSTEM_TYPES[e.type];
        if (!s) continue;
        out.push({ key: `t-${c.id}-${i}`, at: e.at, kind: "system", couple: c, icon: "system", tone: s.tone, title: s.title, text: e.text.replace(/\s#\w+$/, "") });
      }
    }
    for (const t of tests) {
      const spoke = (t.transcript ?? []).some((x) => x.role === "user");
      out.push({
        key: `x-${t.id}`, at: t.at, kind: "call", test: t, icon: "test", tone: "violet",
        title: `🧪 Test araması — ${!t.status || ["initiated", "in-progress", "processing"].includes(t.status) ? "sürüyor" : spoke ? "görüşüldü" : "açılmadı"}`,
        text: t.summary,
      });
    }
    const term = q.toLocaleLowerCase("tr-TR").trim();
    const digits = term.replace(/\D/g, "");
    return out
      .filter((e) => kind === "all" || e.kind === kind)
      .filter((e) => {
        if (!term) return true;
        const name = (e.couple?.name ?? e.test?.name ?? "").toLocaleLowerCase("tr-TR");
        const phone = e.couple?.phone ?? e.test?.phone ?? "";
        return name.includes(term) || (digits.length >= 3 && phone.includes(digits)) || (e.text ?? "").toLocaleLowerCase("tr-TR").includes(term);
      })
      .sort((a, b) => b.at.localeCompare(a.at));
  }, [couples, tests, kind, q]);

  const shown = events.slice(0, limit);
  const groups: { day: string; items: Ev[] }[] = [];
  for (const e of shown) {
    const d = dayHeader(e.at);
    if (groups.at(-1)?.day !== d) groups.push({ day: d, items: [] });
    groups.at(-1)!.items.push(e);
  }

  return (
    <div className="space-y-5">
      <AdminPanelHeader eyebrow="Canlı" title="Hareketler" icon={Activity} description="Kim, ne zaman arandı; ne konuşuldu; hangi mesaj gitti; çift ne yazdı — saat saat. 30 sn'de bir yenilenir." />

      <div className="rm-card space-y-3 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex rounded-xl bg-slate-100 p-1">
            {([["all", "Tümü"], ["call", "Aramalar"], ["message", "Mesajlar"], ["system", "Diğer"]] as [Kind | "all", string][]).map(([k, l]) => (
              <button key={k} type="button" onClick={() => setKind(k)} className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold transition-all", kind === k ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800")}>
                {l}
              </button>
            ))}
          </div>
          <label className="relative block sm:w-72">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="İsim, telefon ya da kelime ara" className="h-10 w-full rounded-xl border border-slate-200 bg-white pr-3 pl-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300" />
          </label>
        </div>
      </div>

      {couples === null ? (
        <div className="rm-card h-72 animate-pulse" />
      ) : shown.length === 0 ? (
        <p className="rm-card px-4 py-10 text-center text-sm text-slate-500">Hareket yok.</p>
      ) : (
        <div className="space-y-5">
          {groups.map((g) => (
            <section key={g.day}>
              <p className="mb-2 px-1 text-xs font-semibold tracking-[0.08em] text-slate-500 uppercase">{g.day}</p>
              <ul className="rm-card divide-y divide-slate-100 overflow-hidden">
                {g.items.map((e) => (
                  <EventRow key={e.key} e={e} onOpen={() => setOpen(e)} />
                ))}
              </ul>
            </section>
          ))}
          {events.length > limit && (
            <button type="button" onClick={() => setLimit(limit + 150)} className="mx-auto block rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-200">
              Daha fazla göster ({events.length - limit})
            </button>
          )}
        </div>
      )}

      <DetailModal e={open} onClose={() => setOpen(null)} />
    </div>
  );
}

function EventRow({ e, onOpen }: { e: Ev; onOpen: () => void }) {
  const Icon = e.icon === "noanswer" ? PhoneOff : e.icon === "call" ? Phone : e.icon === "test" ? FlaskConical : e.icon === "system" ? Activity : MessageCircle;
  const who = e.couple ? `${e.couple.name} · ${displayPhone(e.couple.phone)}` : e.test ? `${e.test.name} · ${displayPhone(e.test.phone)}` : "";
  const hasDetail = Boolean(e.call || e.test || e.msg);
  return (
    <li className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50/70 sm:px-5">
      <span className="w-11 shrink-0 pt-1 text-xs font-semibold text-slate-500 tabular-nums">{hhmm(e.at)}</span>
      <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-xl", TONE[e.tone])}>
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-900">{e.title}</p>
        <p className="text-xs text-slate-500">
          {who}
          {e.couple ? ` · ${SRC[e.couple.source] ?? e.couple.source}` : ""}
          {e.call?.durationSec ? ` · ${dur(e.call.durationSec)}` : e.test?.durationSec ? ` · ${dur(e.test.durationSec)}` : ""}
        </p>
        {e.text && <p className={cn("mt-1 line-clamp-2 text-sm", e.icon === "msg-in" ? "font-medium text-rose-800" : "text-slate-700")}>{e.text}</p>}
      </div>
      {hasDetail && (
        <button type="button" onClick={onOpen} className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-indigo-700 transition-colors hover:border-indigo-300 hover:bg-indigo-50">
          Detay
        </button>
      )}
    </li>
  );
}

function DetailModal({ e, onClose }: { e: Ev | null; onClose: () => void }) {
  useEffect(() => {
    if (!e) return;
    const k = (ev: KeyboardEvent) => ev.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [e, onClose]);
  if (typeof document === "undefined") return null;

  const call = e?.call;
  const test = e?.test;
  const c = e?.couple;
  const conv = call?.externalId?.startsWith("conv_") ? call.externalId : test?.id;
  const audio = call?.recordingUrl ?? (conv ? `/api/admin/ai-recording/${conv}` : undefined);
  const lines: { role: "agent" | "user"; text: string }[] = test?.transcript
    ? test.transcript
    : (call?.transcript ?? "")
        .split("\n")
        .filter(Boolean)
        .map((l) => ({ role: l.startsWith("Asistan:") ? ("agent" as const) : ("user" as const), text: l.replace(/^(Asistan|Çift):\s*/, "") }));
  const spoke = test ? (test.transcript ?? []).some((x) => x.role === "user") : call ? call.outcome !== "no_answer" : false;

  return createPortal(
    <AnimatePresence>
      {e && (
        <>
          <motion.div key="o" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[70] bg-slate-900/30 backdrop-blur-[2px]" onClick={onClose} />
          <motion.div
            key="m"
            role="dialog"
            aria-modal="true"
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="fixed inset-x-3 top-[6vh] z-[71] mx-auto flex max-h-[88vh] max-w-2xl flex-col overflow-hidden rounded-3xl border border-white/60 bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
              <div className="min-w-0">
                <p className="font-editorial text-lg text-slate-900">{e.title}</p>
                <p className="text-xs text-slate-500">
                  {new Date(e.at).toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", dateStyle: "long", timeStyle: "short" })}
                  {c ? ` · ${c.name} · ${displayPhone(c.phone)} · ${SRC[c.source] ?? c.source}` : test ? ` · ${test.name} · ${displayPhone(test.phone)}` : ""}
                </p>
              </div>
              <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:text-slate-900">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
              {c && (
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700">{GRADE_LABEL[c.grade]}</span>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-indigo-700">➡️ {nextStep(c).text}</span>
                </div>
              )}

              {e.msg && (
                <div className={cn("rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap", e.msg.direction === "out" ? "bg-[#D9FDD3] text-slate-900" : "bg-slate-100 text-slate-900")}>
                  {e.msg.text}
                </div>
              )}

              {(call || test) && (
                <>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className={cn("rounded-full px-2.5 py-1 font-semibold", spoke ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700")}>{spoke ? "Açtı — görüşüldü" : "Açmadı / konuşma olmadı"}</span>
                    {(call?.durationSec || test?.durationSec) && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">{dur(call?.durationSec ?? test?.durationSec)}</span>}
                    {call && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Sonuç: {OUTCOME_LABEL[call.outcome]}</span>}
                    {test?.sonuc && <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-600">Sonuç: {test.sonuc}</span>}
                  </div>
                  {(call?.summary || test?.summary) && (
                    <div className="rounded-2xl border border-slate-200 p-3.5">
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Özet</p>
                      <p className="mt-1 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{call?.summary ?? test?.summary}</p>
                    </div>
                  )}
                  {call?.notes && (
                    <div className="flex flex-wrap gap-1.5 text-xs">
                      {call.notes.cekimTuru && <span className="rounded-lg bg-slate-100 px-2 py-1">🎬 {call.notes.cekimTuru}</span>}
                      {call.notes.paket && <span className="rounded-lg bg-slate-100 px-2 py-1">📦 {call.notes.paket}</span>}
                      {call.notes.ekstralar && <span className="rounded-lg bg-slate-100 px-2 py-1">➕ {call.notes.ekstralar}</span>}
                      {call.notes.itiraz && <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">⚠️ {call.notes.itiraz}</span>}
                      {call.notes.tarihTut && <span className="rounded-lg bg-orange-50 px-2 py-1 font-semibold text-orange-700">🔥 Tarihi 24 saat tut</span>}
                    </div>
                  )}
                  {spoke && audio && (
                    <div>
                      <p className="text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Ses kaydı</p>
                      <WaveAudio src={audio} seed={conv ?? e.key} />
                    </div>
                  )}
                  {lines.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase">Konuşma metni</p>
                      <ul className="space-y-1.5 rounded-2xl bg-slate-50 p-3">
                        {lines.map((l, i) => (
                          <li key={i} className={cn("max-w-[88%] rounded-2xl px-3 py-1.5 text-sm", l.role === "agent" ? "bg-indigo-600 text-white" : "ml-auto bg-white text-slate-900 shadow-sm")}>
                            <span className="block text-[10px] opacity-70">{l.role === "agent" ? "Asistan" : "Karşı taraf"}</span>
                            {l.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
