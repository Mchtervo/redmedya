"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Calendar,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  MessageCircle,
  Phone,
  Plus,
  Search,
  Send,
  Unlock,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AdminEmptyState, AdminPanelHeader, AdminSection } from "@/components/admin/admin-panel-header";
import { AiAgentsCard, AiKpiRow } from "@/components/admin/admin-ai-command-center";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import { WaveAudio } from "@/components/admin/admin-wave-audio";
import { AdminTestCallBox } from "@/components/admin/admin-ai-test-call";
import { AdminAutomationSettings, useAutomation } from "@/components/admin/admin-automation-settings";
import { useAiSystemStatus } from "@/hooks/use-ai-system-status";
import type {
  AiCapacityConfig,
  AiCapacityInfo,
  AiCouple,
  AiCoupleGrade,
  AiCoupleStatus,
} from "@/types/ai-couples";
import { displayPhone, GRADE_LABEL, OUTCOME_LABEL, STATUS_LABEL } from "@/lib/ai-couples/rules";
import { historyForAgent, nextStep, type NextStep } from "@/lib/ai-couples/journey";

const STEP_STYLE: Record<NextStep["tone"], string> = {
  action: "border-indigo-100 bg-indigo-50/70 text-indigo-800",
  wait: "border-slate-200 bg-slate-50 text-slate-600",
  done: "border-emerald-100 bg-emerald-50/70 text-emerald-800",
  stop: "border-rose-100 bg-rose-50/70 text-rose-800",
  you: "border-rose-200 bg-rose-50 text-rose-800 font-semibold",
};

type Payload = {
  couples: AiCouple[];
  capacityConfig: AiCapacityConfig;
  months: AiCapacityInfo[];
  integration: { baseUrl: string; apiToken: string; telegramReady: boolean };
  /** Takvimdeki rezervasyon günleri → o gün kaç düğün */
  bookedDays?: Record<string, number>;
};

type DayState = { tone: "ok" | "full" | "past"; text: string };

/** Panel tarafı tarih durumu (sunucudaki checkDate ile aynı kurallar): kapalı gün, günlük kapasite, ay kontenjanı */
function dayStateOf(date: string | undefined, d: Payload): DayState | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
  if (date < today) return { tone: "past", text: "Geçmiş tarih" };
  if ((d.capacityConfig.blockedDates ?? []).includes(date)) return { tone: "full", text: "Bu gün kapalı (elle kapatıldı)" };
  const booked = d.bookedDays?.[date] ?? 0;
  const perDay = d.capacityConfig.perDay ?? 1;
  if (booked >= perDay) return { tone: "full", text: `Bu tarih DOLU — takvimde ${booked} rezervasyon var` };
  const m = d.months.find((x) => x.monthKey === date.slice(0, 7));
  if (m && m.remaining <= 0) return { tone: "full", text: `${m.monthLabel} kontenjanı doldu` };
  return { tone: "ok", text: `Tarih MÜSAİT${m ? ` · ${m.monthLabel} için ${m.remaining} yer kaldı` : ""}` };
}

type Filter = AiCoupleGrade | "all";

/** Derece rozetleri: sıcak = yumuşak kırmızı, ılık = amber, soğuk = buz mavisi, kara liste = koyu antrasit */
const GRADE_STYLE: Record<AiCoupleGrade, string> = {
  hot: "border-rose-200 bg-rose-50 text-rose-700",
  warm: "border-amber-200 bg-amber-50 text-amber-800",
  cold: "border-sky-200 bg-sky-50 text-sky-800",
  blacklist: "border-slate-800 bg-slate-800 text-white",
};

const SOURCE_LABEL: Record<AiCouple["source"], string> = {
  dugun_com: "Düğün.com",
  meta_form: "Meta",
  web: "Web sitesi",
  manual: "Elle",
};
const SOURCE_STYLE: Record<AiCouple["source"], string> = {
  dugun_com: "bg-fuchsia-50 text-fuchsia-700",
  meta_form: "bg-blue-50 text-blue-700",
  web: "bg-slate-100 text-slate-700",
  manual: "bg-slate-100 text-slate-700",
};

const btn =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-indigo-200 hover:text-indigo-700 disabled:opacity-40";
const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white shadow-[0_8px_18px_-8px_rgba(79,70,229,0.8)] transition-colors hover:bg-indigo-700 disabled:opacity-40";
const field =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300";
const label = "text-[11px] font-semibold tracking-[0.08em] text-slate-500 uppercase";

const CHANNEL_LABEL: Record<string, string> = { whatsapp: "WhatsApp", sms: "SMS", dugun_com: "Düğün.com", telegram: "Telegram" };
const AYLAR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** "2027-01-17" → "17 Ocak 2027"; tarih yoksa nottaki "Düğün: Şubat 2027" bilgisini gösterir. */
function weddingText(c: AiCouple): string {
  const m = c.weddingDate?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${Number(m[3])} ${AYLAR[Number(m[2]) - 1]} ${m[1]}`;
  const fromNote = c.note?.match(/Düğün: ([^·\n]+)/);
  return fromNote ? fromNote[1].trim() : "tarih yok";
}

type Stage = "needsReply" | "queued" | "smsSent" | "noAnswer" | "called" | "written" | "followup" | "replied" | "won" | "lost" | "stopped" | "badnumber";
const STAGE_LABEL: Record<Stage, string> = {
  needsReply: "Cevap yazdı – SİZ DÖNÜN",
  smsSent: "Düğün.com SMS gitti – aranacak",
  noAnswer: "Arandı – ulaşılamadı",
  queued: "Sırada (henüz ulaşılmadı)",
  called: "Arandı",
  written: "Yazıldı – cevap bekleniyor",
  followup: "Takip gönderildi",
  replied: "Cevap verdi",
  won: "Rezervasyon yaptı",
  lost: "İlgilenmiyor",
  stopped: "İstemiyor / kara liste",
  badnumber: "Numara hatalı",
};
const STAGE_STYLE: Record<Stage, string> = {
  needsReply: "border-rose-300 bg-rose-600 text-white font-semibold",
  smsSent: "border-violet-200 bg-violet-50 text-violet-700",
  noAnswer: "border-orange-200 bg-orange-50 text-orange-700",
  queued: "border-slate-200 bg-white text-slate-600",
  called: "border-sky-200 bg-sky-50 text-sky-700",
  written: "border-indigo-200 bg-indigo-50 text-indigo-700",
  followup: "border-amber-200 bg-amber-50 text-amber-800",
  replied: "border-emerald-200 bg-emerald-50 text-emerald-700",
  won: "border-emerald-300 bg-emerald-600 text-white",
  lost: "border-slate-200 bg-slate-50 text-slate-500",
  stopped: "border-slate-700 bg-slate-800 text-white",
  badnumber: "border-rose-200 bg-white text-rose-700",
};
function stageOf(c: AiCouple): Stage {
  if (c.contactLocked) return "stopped";
  if (c.status === "won") return "won";
  if ((c.note ?? "").includes("Numara hatalı")) return "badnumber";
  if (c.status === "lost") return "lost";
  const lastMsg = c.messages[c.messages.length - 1];
  if (lastMsg?.direction === "in") return "needsReply";
  if (c.messages.some((m) => m.direction === "in")) return "replied";
  const out = c.messages.filter((m) => m.direction === "out");
  if (out.some((m) => m.text.includes("fiyat listemize göz atabildiniz"))) return "followup";
  const lastCall = c.calls[c.calls.length - 1];
  if (lastCall?.outcome === "no_answer") return "noAnswer";
  if (!c.calls.length && out.length && out.every((m) => m.channel !== "whatsapp")) return "smsSent";
  if (out.length) return "written";
  if (c.calls.length) return "called";
  return "queued";
}

function fmt(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("tr-TR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

const AVATAR_TONES = [
  "from-indigo-500 to-blue-500",
  "from-rose-500 to-pink-500",
  "from-emerald-500 to-teal-500",
  "from-amber-500 to-orange-500",
  "from-violet-500 to-purple-500",
  "from-sky-500 to-cyan-500",
];
function initials(name: string) {
  const p = name.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] ?? "?") + (p.length > 1 ? p[p.length - 1][0] : "")).toLocaleUpperCase("tr-TR");
}
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}
function Avatar({ c, size = "md" }: { c: AiCouple; size?: "md" | "lg" }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br font-semibold text-white",
        size === "lg" ? "h-14 w-14 text-lg" : "h-11 w-11 text-sm",
        c.contactLocked ? "from-slate-600 to-slate-800" : AVATAR_TONES[hash(c.id) % AVATAR_TONES.length]
      )}
    >
      {initials(c.name)}
      {c.contactLocked && (
        <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-slate-900">
          <Lock className="h-2.5 w-2.5" />
        </span>
      )}
    </span>
  );
}

/** Henüz konuşulmamış çift "soğuk" değil, "yeni"dir (sistem varsayılanı yanıltmasın) */
function GradeBadge({ g, fresh }: { g: AiCoupleGrade; fresh?: boolean }) {
  if (fresh && g === "cold")
    return <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-sky-700">🆕 Henüz konuşulmadı</span>;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap", GRADE_STYLE[g])}>
      {g === "blacklist" && <Lock className="h-3 w-3" />}
      {GRADE_LABEL[g]}
    </span>
  );
}

export function AdminAiCouplesPanel() {
  const [data, setData] = useState<Payload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>("all");
  const [stage, setStage] = useState<Stage | "all">("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<{ id: string; focusWa?: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const { status, refresh } = useAiSystemStatus();
  useAutomation(); // takip gün ayarı yüklenince liste yeniden çizilir
  const capacityRef = useRef<HTMLDetailsElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const load = useCallback(() => {
    fetch("/api/admin/ai-couples")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: Payload | null) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useAdminDataSync(load);

  const couples = useMemo(() => data?.couples ?? [], [data]);
  const real = useMemo(() => couples.filter((x) => x.sourceRef !== "test"), [couples]);
  const counts = useMemo(() => {
    const c: Record<AiCoupleGrade, number> = { hot: 0, warm: 0, cold: 0, blacklist: 0 };
    for (const x of real) c[x.grade] += 1;
    return c;
  }, [real]);

  const visible = useMemo(() => {
    const q = search.toLocaleLowerCase("tr-TR").trim();
    const digits = q.replace(/\D/g, "");
    return couples.filter(
      (c) =>
        (filter === "all" || c.grade === filter) &&
        (stage === "all" || stageOf(c) === stage) &&
        (!q || c.name.toLocaleLowerCase("tr-TR").includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
    );
  }, [couples, filter, stage, search]);
  const sorted = useMemo(() => {
    const rank = (c: AiCouple) => (stageOf(c) === "needsReply" ? 0 : c.calls.at(-1)?.notes?.tarihTut && !c.contactLocked ? 1 : c.grade === "hot" ? 2 : 3);
    return [...visible].sort((a, b) => rank(a) - rank(b) || b.updatedAt.localeCompare(a.updatedAt));
  }, [visible]);
  const stageCounts = useMemo(() => {
    const m = {} as Record<Stage, number>;
    for (const c of real) {
      const s = stageOf(c);
      m[s] = (m[s] ?? 0) + 1;
    }
    return m;
  }, [real]);

  const patch = async (id: string, body: Record<string, unknown>) => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/ai-couples/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) setMsg({ text: j.error ?? "Kaydedilemedi", ok: false });
    } catch {
      setMsg({ text: "Bağlantı hatası — tekrar deneyin", ok: false });
    } finally {
      setBusy(false);
      load();
    }
  };

  const quickCall = async (c: AiCouple) => {
    if (!confirm(`${c.name} şimdi sesli asistanla aransın mı?`)) return;
    setMsg({ text: `📞 ${c.name} aranıyor… (20-40 sn içinde telefon çalar)`, ok: true });
    try {
      const res = await fetch(`/api/admin/ai-couples/${c.id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "call" }) });
      const j = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setMsg(res.ok ? { text: `📞 ${c.name} için arama başlatıldı — sonuç birkaç dakika içinde burada`, ok: true } : { text: `⚠️ ${j.error ?? j.message ?? "Arama başlatılamadı"}`, ok: false });
      if (res.ok) load();
    } catch {
      setMsg({ text: "⚠️ Bağlantı hatası — arama başlatılamadı, tekrar deneyin", ok: false });
    }
  };

  const toggleCampaign = async (target: "kampanya" | "arama", on: boolean) => {
    const ad = target === "kampanya" ? "WhatsApp kampanyası" : "Otomatik arama";
    if (!confirm(`${ad} ${on ? "BAŞLATILSIN" : "DURDURULSUN"} mu?`)) return;
    const res = await fetch("/api/admin/ai-campaign", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ target, op: on ? "resume" : "pause" }) }).catch(() => null);
    setMsg(res?.ok ? { text: `✅ ${ad} ${on ? "başlatıldı" : "durduruldu"}`, ok: true } : { text: `⚠️ ${ad} değiştirilemedi — tekrar deneyin`, ok: false });
    refresh();
  };

  const openStage = (what: "calls" | "whatsapp" | "hot" | "capacity") => {
    if (what === "capacity") {
      if (capacityRef.current) capacityRef.current.open = true;
      return capacityRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setSearch("");
    if (what === "hot") { setFilter("hot"); setStage("all"); }
    if (what === "calls") { setFilter("all"); setStage("called"); }
    if (what === "whatsapp") { setFilter("all"); setStage("written"); }
    listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rm-card h-28 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => <div key={i} className="rm-card h-36 animate-pulse" />)}
        </div>
        <div className="rm-card h-64 animate-pulse" />
      </div>
    );
  }
  if (!data) return <AdminEmptyState title="Veri alınamadı" description="Sayfayı yenileyip tekrar deneyin." />;

  const openCouple = open ? couples.find((c) => c.id === open.id) ?? null : null;
  const callsEnabled = status.arama !== false;

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="AI Satış"
        title="AI Çift Yönetimi"
        icon={Bot}
        meta={`${real.length} çift · ${counts.hot} sıcak · ${counts.warm} ılık · ${stageCounts.needsReply ?? 0} cevap bekliyor`}
      />

      <AiKpiRow couples={couples} months={data.months} onOpenStage={openStage} />

      <AiAgentsCard status={status} onToggle={toggleCampaign} horizontal />
      <AdminAutomationSettings />
      <AdminTestCallBox />

      {msg && (
        <p
          role="status"
          className={cn(
            "fixed top-4 left-1/2 z-[90] w-[min(92vw,34rem)] -translate-x-1/2 rounded-2xl border px-4 py-2.5 text-sm shadow-lg",
            msg.ok ? "border-indigo-100 bg-indigo-50 text-indigo-800" : "border-rose-200 bg-rose-50 text-rose-800"
          )}
        >
          {msg.text}
          <button type="button" onClick={() => setMsg(null)} className="ml-2 font-semibold underline">Kapat</button>
        </p>
      )}

      {/* Çift listesi */}
      <div ref={listRef} className="rm-card scroll-mt-28 overflow-hidden">
        <div className="space-y-3 border-b border-slate-100 p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-editorial text-lg text-slate-900">Çiftler</h3>
              <p className="text-xs text-slate-500">{sorted.length} çift gösteriliyor · cevap bekleyenler en üstte</p>
            </div>
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <label className="relative block sm:w-72">
                <span className="sr-only">Çift ara</span>
                <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="İsim veya telefon ara" className={cn(field, "pl-10")} />
              </label>
              <AddCoupleForm onDone={load} />
            </div>
          </div>

          {/* Derece sekmeleri */}
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none]">
            {([["all", "Tümü", couples.length], ...(Object.keys(GRADE_LABEL) as AiCoupleGrade[]).map((g) => [g, GRADE_LABEL[g], counts[g]])] as [Filter, string, number][]).map(([k, l, n]) => (
              <button
                key={k}
                type="button"
                onClick={() => setFilter(k)}
                className={cn(
                  "inline-flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                  filter === k ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {l}
                <span className={cn("rounded-full px-1.5 text-[11px] font-bold tabular-nums", filter === k ? "bg-white/20" : "bg-white text-slate-700")}>{n}</span>
              </button>
            ))}
          </div>

          {/* Aşama filtresi */}
          <div className="flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setStage("all")} className={cn("rounded-full border px-3 py-1 text-[11px] font-medium", stage === "all" ? "border-indigo-300 bg-indigo-50 text-indigo-700" : "border-slate-200 bg-white text-slate-500")}>
              Tüm aşamalar
            </button>
            {(Object.keys(STAGE_LABEL) as Stage[]).filter((s) => stageCounts[s]).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setStage(stage === s ? "all" : s)}
                className={cn("rounded-full border px-3 py-1 text-[11px] font-medium transition-opacity", STAGE_STYLE[s], stage !== "all" && stage !== s && "opacity-50")}
              >
                {STAGE_LABEL[s]} · {stageCounts[s]}
              </button>
            ))}
          </div>
        </div>

        {visible.length === 0 ? (
          <div className="p-4">
            <AdminEmptyState title="Çift yok" description="Bu filtrede çift bulunamadı. Düğün.com / Meta form bağlandığında yeni talepler burada görünür." />
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {sorted.map((c) => (
              <CoupleRow
                key={c.id}
                c={c}
                callsEnabled={callsEnabled}
                onOpen={(focusWa) => setOpen({ id: c.id, focusWa })}
                onCall={() => quickCall(c)}
              />
            ))}
          </ul>
        )}
      </div>

      <details ref={capacityRef} className="group rm-card scroll-mt-28 overflow-hidden">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 sm:px-5 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-sm font-semibold text-slate-900">⚙️ Kontenjan ve bağlantı ayarları</span>
            <span className="block text-xs text-slate-500">Aylık kapasite, drone hediyesi, n8n anahtarı, Telegram</span>
          </span>
          <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 group-open:hidden">Aç</span>
          <span className="hidden rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 group-open:inline">Kapat</span>
        </summary>
        <div className="space-y-4 border-t border-slate-100 p-3 sm:p-4">
          <CapacityEditor config={data.capacityConfig} months={data.months} onSaved={load} />
          <IntegrationBox integration={data.integration} />
        </div>
      </details>

      <CoupleDrawer
        dayState={openCouple ? dayStateOf(openCouple.weddingDate, data) : null}
        couple={openCouple}
        focusWa={open?.focusWa}
        callsEnabled={callsEnabled}
        busy={busy}
        onClose={() => setOpen(null)}
        onPatch={(b) => openCouple && patch(openCouple.id, b)}
        onReload={load}
      />
    </div>
  );
}

/* ───────────────────────── Liste satırı ───────────────────────── */

function CoupleRow({ c, callsEnabled, onOpen, onCall }: { c: AiCouple; callsEnabled: boolean; onOpen: (focusWa?: boolean) => void; onCall: () => void }) {
  const st = stageOf(c);
  const step = nextStep(c, new Date(), callsEnabled);
  const lastCall = c.calls[c.calls.length - 1];
  const lastMsg = c.messages[c.messages.length - 1];
  return (
    <li
      className={cn(
        "group relative flex cursor-pointer flex-col gap-3 px-4 py-4 transition-colors hover:bg-indigo-50/40 sm:px-5 lg:flex-row lg:items-center",
        st === "needsReply" && "bg-rose-50/50"
      )}
      onClick={() => onOpen()}
    >
      {st === "needsReply" && <span className="absolute inset-y-0 left-0 w-1 bg-rose-500" />}
      <div className="flex min-w-0 flex-1 items-start gap-3">
        <Avatar c={c} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-[15px] font-semibold text-slate-900">{c.name}</p>
            <span className={cn("rounded-md px-1.5 py-0.5 text-[10px] font-semibold", SOURCE_STYLE[c.source])}>{SOURCE_LABEL[c.source]}</span>
            {c.sourceRef === "test" && <span className="rounded-md bg-violet-50 px-1.5 py-0.5 text-[10px] font-semibold text-violet-700">🧪 Test</span>}
            {lastCall?.notes?.tarihTut && !c.contactLocked && <span className="rounded-md bg-orange-50 px-1.5 py-0.5 text-[10px] font-semibold text-orange-700">🔥 Tarih tutalım dedi</span>}
          </div>
          <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-900 tabular-nums">
              <Phone className="h-3.5 w-3.5 text-slate-400" />
              {displayPhone(c.phone)}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <Calendar className="h-3.5 w-3.5 text-slate-400" />
              {weddingText(c)}
            </span>
            <span className="text-xs text-slate-500">📞 {c.callCount} arama</span>
          </p>
          <p className="mt-1.5 line-clamp-1 text-xs text-slate-600">
            <span className="font-semibold text-slate-700">Sonraki adım:</span> {step.text}
          </p>
          {lastMsg && (
            <p className={cn("mt-1 line-clamp-1 text-xs", lastMsg.direction === "in" ? "font-medium text-rose-700" : "text-slate-500")}>
              {lastMsg.direction === "in" ? "💬 Çift: " : "↗ Biz: "}
              {lastMsg.text.replace(/\s+/g, " ").slice(0, 140)}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pl-14 lg:pl-0">
        <span className={cn("rounded-full border px-2.5 py-1 text-[11px] whitespace-nowrap", STAGE_STYLE[st])}>{STAGE_LABEL[st]}</span>
        <GradeBadge g={c.grade} fresh={!c.calls.some((x) => x.outcome !== "no_answer") && !c.messages.some((m) => m.direction === "in")} />
        {!c.contactLocked && (
          <span className="ml-auto flex gap-1.5 lg:ml-2">
            <button
              type="button"
              title="Hemen ara (sesli asistan)"
              aria-label="Hemen ara"
              onClick={(e) => { e.stopPropagation(); onCall(); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 transition-colors hover:bg-indigo-600 hover:text-white"
            >
              <Phone className="h-4 w-4" />
            </button>
            <button
              type="button"
              title="WhatsApp yaz"
              aria-label="WhatsApp yaz"
              onClick={(e) => { e.stopPropagation(); onOpen(true); }}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600 transition-colors hover:bg-emerald-600 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
            </button>
          </span>
        )}
      </div>
    </li>
  );
}

/* ───────────────────────── Sağdan açılan detay çekmecesi ───────────────────────── */

function CoupleDrawer({
  dayState,
  couple: c,
  focusWa,
  callsEnabled,
  busy,
  onClose,
  onPatch,
  onReload,
}: {
  dayState: DayState | null;
  couple: AiCouple | null;
  focusWa?: boolean;
  callsEnabled: boolean;
  busy: boolean;
  onClose: () => void;
  onPatch: (b: Record<string, unknown>) => void;
  onReload: () => void;
}) {
  const isOpen = Boolean(c);
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [isOpen, onClose]);

  if (typeof document === "undefined") return null;
  // body'ye taşınır: sayfa animasyonları / üst katmanlar çekmeceyi etkilemesin
  return createPortal(
    <AnimatePresence>
      {c && (
        <>
          <motion.div
            key="overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-slate-900/25 backdrop-blur-[2px]"
            onClick={onClose}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-modal="true"
            aria-label={`${c.name} detay`}
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 38 }}
            className="rm-glass fixed inset-y-0 right-0 z-[61] flex w-full max-w-xl flex-col border-l border-white/60 shadow-[-30px_0_60px_-20px_rgba(15,23,42,0.25)]"
          >
            <DrawerBody key={c.id} dayState={dayState} c={c} focusWa={focusWa} callsEnabled={callsEnabled} busy={busy} onClose={onClose} onPatch={onPatch} onReload={onReload} />
          </motion.aside>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

function DrawerBody({
  dayState,
  c,
  focusWa,
  callsEnabled,
  busy,
  onClose,
  onPatch,
  onReload,
}: {
  dayState: DayState | null;
  c: AiCouple;
  focusWa?: boolean;
  callsEnabled: boolean;
  busy: boolean;
  onClose: () => void;
  onPatch: (b: Record<string, unknown>) => void;
  onReload: () => void;
}) {
  const [note, setNote] = useState(c.note ?? "");
  const st = stageOf(c);
  const step = nextStep(c, new Date(), callsEnabled);
  const lastCall = c.calls[c.calls.length - 1];

  return (
    <>
      {/* Başlık */}
      <div className="border-b border-slate-200/70 px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <Avatar c={c} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-editorial text-xl text-slate-900">{c.name}</p>
            <a href={`tel:${c.phone}`} className="mt-0.5 inline-flex items-center gap-1.5 text-base font-semibold text-slate-900 tabular-nums hover:text-indigo-700">
              <Phone className="h-4 w-4 text-slate-400" />
              {displayPhone(c.phone)}
            </a>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-xs text-slate-500">
              <span>💍 {weddingText(c)}</span>
              <span>{SOURCE_LABEL[c.source]}</span>
              <span>{STATUS_LABEL[c.status]}</span>
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Kapat" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-slate-900">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className={cn("rounded-full border px-2.5 py-1 text-[11px]", STAGE_STYLE[st])}>{STAGE_LABEL[st]}</span>
          <GradeBadge g={c.grade} fresh={!c.calls.some((x) => x.outcome !== "no_answer") && !c.messages.some((m) => m.direction === "in")} />
          {lastCall?.notes?.tarihTut && <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[11px] font-semibold text-orange-700">🔥 Tarihi 24 saat tut</span>}
        </div>
        {dayState && (
          <p
            className={cn(
              "mt-3 flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium",
              dayState.tone === "ok" ? "border-emerald-200 bg-emerald-50 text-emerald-800" : dayState.tone === "full" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-slate-200 bg-slate-50 text-slate-600"
            )}
          >
            <Calendar className="h-4 w-4 shrink-0" /> 📅 {weddingText(c)}: {dayState.text}
          </p>
        )}
        {st === "needsReply" && (
          <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            <span className="min-w-0 flex-1">Çift yazdı, cevap bekliyor. Telefondan cevap verdiyseniz işaretleyin.</span>
            <button
              type="button"
              disabled={busy}
              onClick={() => onPatch({ markReplied: true })}
              className="shrink-0 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
            >
              ✓ Cevap verdim
            </button>
          </div>
        )}
        <div className={cn("mt-2 flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 text-sm", STEP_STYLE[step.tone])}>
          <span className="min-w-0 flex-1">➡️ {step.text}</span>
          {!c.contactLocked && c.status !== "won" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (c.callsPaused) return onPatch({ callsPaused: false });
                if (confirm(`${c.name} için planlanan / otomatik aramalar iptal edilsin mi?\n(WhatsApp ve elle arama devam eder; istediğinizde geri açabilirsiniz.)`)) onPatch({ callsPaused: true });
              }}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold disabled:opacity-40",
                c.callsPaused ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50" : "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
              )}
            >
              {c.callsPaused ? "✅ Aramayı geri aç" : "🚫 Aramayı iptal et"}
            </button>
          )}
          {!c.contactLocked && c.status !== "won" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (c.messagesPaused) return onPatch({ messagesPaused: false });
                if (confirm(`${c.name} için planlanan otomatik WhatsApp mesajları (kampanya, takip, hatırlatma) iptal edilsin mi?\n(Sizin elle yazdıklarınız gider.)`)) onPatch({ messagesPaused: true });
              }}
              className={cn(
                "shrink-0 rounded-lg border px-2.5 py-1 text-xs font-semibold disabled:opacity-40",
                c.messagesPaused ? "border-emerald-300 bg-white text-emerald-700 hover:bg-emerald-50" : "border-rose-300 bg-white text-rose-700 hover:bg-rose-50"
              )}
            >
              {c.messagesPaused ? "✅ Mesajı geri aç" : "🚫 Mesajı iptal et"}
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
        {c.contactLocked && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-white">
            <p className="flex items-center gap-2 font-semibold"><Lock className="h-4 w-4" /> İletişim kapalı</p>
            <p className="mt-1 text-slate-300">{c.lockReason ?? "Kara liste"} · {fmt(c.lockedAt)}</p>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                const ok = prompt(`DİKKAT: ${c.name} "${c.lockReason}" sebebiyle kilitli. Çift açıkça izin verdiyse kilidi açmak için KILIDI AC yazın.`);
                if (ok === "KILIDI AC") onPatch({ unlock: true, confirm: "KILIDI AC" });
              }}
              className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 disabled:opacity-40"
            >
              <Unlock className="h-3.5 w-3.5" /> KILIDI AC
            </button>
          </div>
        )}
        {c.followUpAt && !c.followUpSentAt && !c.contactLocked && (
          <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">⏰ Düşünüyor — tekrar arama: {fmt(c.followUpAt)} (açmazsa WhatsApp)</p>
        )}

        {/* Durum kontrolleri */}
        {!c.contactLocked && (
          <div className="space-y-2">
            <p className={label}>Durum</p>
            <div className="flex flex-wrap gap-2">
              {(["hot", "warm", "cold"] as AiCoupleGrade[]).map((g) => (
                <button key={g} type="button" disabled={busy || c.grade === g} onClick={() => onPatch({ grade: g })} className={cn(btn, c.grade === g && "border-indigo-300 bg-indigo-50 text-indigo-700 disabled:opacity-100")}>
                  {GRADE_LABEL[g]}
                </button>
              ))}
              <button type="button" disabled={busy} onClick={() => onPatch({ status: "thinking" as AiCoupleStatus })} className={btn}>Düşünüyor (+7 gün)</button>
              <button type="button" disabled={busy || c.status === "won"} onClick={() => onPatch({ status: "won" as AiCoupleStatus })} className={cn(btn, "border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:text-emerald-800")}>
                <CheckCircle2 className="h-3.5 w-3.5" /> Anlaşıldı (rezervasyon)
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => {
                  if (confirm(`${c.name} kara listeye alınsın mı? Bir daha arama veya mesaj gitmez.`)) onPatch({ grade: "blacklist", reason: "Admin kara listeye aldı" });
                }}
                className={cn(btn, "border-slate-300 text-slate-800 hover:border-slate-800 hover:bg-slate-800 hover:text-white")}
              >
                <Lock className="h-3.5 w-3.5" /> Kara liste
              </button>
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <p className={label}>🧭 Şu ana kadar</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-700">{historyForAgent(c)}</p>
        </div>

        {!c.contactLocked && <ActionBox couple={c} autoFocus={focusWa} onDone={onReload} />}

        <div className="space-y-1.5">
          <p className={label}>Not</p>
          <div className="flex gap-2">
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Not ekle" className={field} />
            <button type="button" disabled={busy} onClick={() => onPatch({ note })} className={btnPrimary}>Kaydet</button>
          </div>
        </div>

        {/* Aramalar */}
        <div className="space-y-2">
          <p className={label}>Görüşmeler ({c.calls.length})</p>
          {c.calls.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 px-3 py-3 text-sm text-slate-500">Henüz arama yok.</p>
          ) : (
            <ul className="space-y-3">
              {[...c.calls].reverse().map((call) => (
                <li key={call.id} className="rounded-2xl border border-slate-200 bg-white p-3.5">
                  <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                    <span>{fmt(call.at)}</span>
                    <span className={cn("rounded-full px-2 py-0.5 font-semibold", call.outcome === "no_answer" ? "bg-orange-50 text-orange-700" : "bg-indigo-50 text-indigo-700")}>{OUTCOME_LABEL[call.outcome]}</span>
                    {call.durationSec ? <span>{Math.max(1, Math.round(call.durationSec / 60))} dk</span> : null}
                    {typeof call.quotedRemaining === "number" ? <span>söylenen kontenjan: {call.quotedRemaining}</span> : null}
                  </p>
                  {call.summary && <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-slate-800">{call.summary}</p>}
                  {call.notes && (
                    <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                      {call.notes.cekimTuru && <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">🎬 {call.notes.cekimTuru}</span>}
                      {call.notes.paket && <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">📦 {call.notes.paket}</span>}
                      {call.notes.ekstralar && <span className="rounded-lg bg-slate-100 px-2 py-1 text-slate-700">➕ {call.notes.ekstralar}</span>}
                      {call.notes.itiraz && <span className="rounded-lg bg-amber-50 px-2 py-1 text-amber-800">⚠️ {call.notes.itiraz}</span>}
                      {call.notes.tarihTut && <span className="rounded-lg bg-orange-50 px-2 py-1 font-semibold text-orange-700">🔥 Tarihi 24 saat tut: EVET</span>}
                    </div>
                  )}
                  {(call.recordingUrl || /^conv_/.test(call.externalId ?? "")) && (
                    <WaveAudio src={call.recordingUrl ?? `/api/admin/ai-recording/${call.externalId}`} seed={call.id} />
                  )}
                  {call.transcript && (
                    <details className="mt-2 text-xs text-slate-600">
                      <summary className="cursor-pointer font-medium text-indigo-600">Konuşma metni</summary>
                      <p className="mt-1.5 whitespace-pre-wrap">{call.transcript}</p>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* WhatsApp sohbeti */}
        {c.messages.length > 0 && (
          <div className="space-y-2">
            <p className={label}>Mesajlar ({c.messages.length})</p>
            <ul className="space-y-2 rounded-2xl bg-[#EFEAE2]/70 p-3">
              {c.messages.slice(-15).map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "max-w-[88%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap shadow-sm",
                    m.direction === "out" ? "ml-auto rounded-br-md bg-[#D9FDD3] text-slate-900" : "rounded-bl-md bg-white text-slate-900"
                  )}
                >
                  {m.text}
                  <span className="mt-1 block text-right text-[10px] text-slate-500">
                    {m.direction === "out" ? "Giden" : "Gelen"} · {CHANNEL_LABEL[m.channel] ?? m.channel} · {fmt(m.at)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <details className="rounded-2xl border border-slate-200 bg-white p-3.5 text-xs text-slate-600">
          <summary className="cursor-pointer font-semibold text-slate-700">Zaman çizelgesi ({c.timeline.length})</summary>
          <ul className="mt-2 space-y-1.5">
            {[...c.timeline].reverse().map((t, i) => (
              <li key={i} className="flex gap-2">
                <span className="shrink-0 text-slate-400 tabular-nums">{fmt(t.at)}</span>
                <span>{t.text}</span>
              </li>
            ))}
          </ul>
        </details>
      </div>
    </>
  );
}

/* ───────────────────────── Müdahale kutusu ───────────────────────── */

function ActionBox({ couple: c, onDone, autoFocus }: { couple: AiCouple; onDone: () => void; autoFocus?: boolean }) {
  const [text, setText] = useState("");
  const [date, setDate] = useState(c.weddingDate ?? "");
  const [info, setInfo] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const run = async (body: Record<string, unknown>, ok: string) => {
    setSending(true);
    setInfo("Gönderiliyor…");
    try {
      const res = await fetch(`/api/admin/ai-couples/${c.id}/action`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = (await res.json().catch(() => ({}))) as { error?: string; message?: string };
      setInfo(res.ok ? ok : `⚠️ ${j.error ?? j.message ?? "İşlem yapılamadı"}`);
      if (res.ok) {
        setText("");
        onDone();
      }
    } catch {
      setInfo("⚠️ Bağlantı hatası — tekrar deneyin");
    } finally {
      setSending(false);
    }
  };
  return (
    <div className="space-y-3 rounded-2xl border border-indigo-100 bg-gradient-to-br from-white to-indigo-50/60 p-3.5">
      <p className={label}>Müdahale</p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        autoFocus={autoFocus}
        placeholder={`${c.name.split(" ")[0]} için WhatsApp mesajı yaz (0540 hattından gider)`}
        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-indigo-300"
      />
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={sending || !text.trim()} onClick={() => run({ action: "whatsapp", text: text.trim() }, "✅ WhatsApp mesajı gönderildi")} className={cn(btnPrimary, "bg-emerald-600 shadow-none hover:bg-emerald-700")}>
          <Send className="h-3.5 w-3.5" /> WhatsApp gönder
        </button>
        <button
          type="button"
          disabled={sending}
          onClick={() => {
            if (confirm(`${c.name} şimdi sesli asistanla aransın mı?`)) run({ action: "call" }, "📞 Arama başlatıldı — sonuç birkaç dakika içinde burada");
          }}
          className={btnPrimary}
        >
          <Phone className="h-3.5 w-3.5" /> Şimdi ara
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        Düğün tarihi
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={cn(field, "h-9 w-40")} />
        <button
          type="button"
          disabled={sending || date === (c.weddingDate ?? "")}
          onClick={async () => {
            const res = await fetch(`/api/admin/ai-couples/${c.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ weddingDate: date }) }).catch(() => null);
            setInfo(res?.ok ? "✅ Tarih kaydedildi" : "⚠️ Tarih kaydedilemedi");
            if (res?.ok) onDone();
          }}
          className={btn}
        >
          Kaydet
        </button>
      </div>
      {info && <p className="text-xs text-slate-700">{info}</p>}
    </div>
  );
}

/* ───────────────────────── Çift ekle ───────────────────────── */

function AddCoupleForm({ onDone }: { onDone: () => void }) {
  const [show, setShow] = useState(false);
  const [f, setF] = useState({ name: "", phone: "", weddingDate: "" });
  const [err, setErr] = useState<string | null>(null);
  if (!show) {
    return (
      <button type="button" onClick={() => setShow(true)} className={cn(btnPrimary, "h-10 px-4 text-sm")}>
        <Plus className="h-4 w-4" /> Çift ekle
      </button>
    );
  }
  return (
    <form
      className="flex w-full flex-wrap gap-2 sm:w-auto"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        const res = await fetch("/api/admin/ai-couples", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) return setErr(j.error ?? "Eklenemedi");
        setF({ name: "", phone: "", weddingDate: "" });
        setShow(false);
        onDone();
      }}
    >
      <input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="İsim" className={cn(field, "w-36 flex-1")} />
      <input required value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} placeholder="05xx" className={cn(field, "w-32 flex-1")} />
      <input type="date" value={f.weddingDate} onChange={(e) => setF({ ...f, weddingDate: e.target.value })} className={cn(field, "w-40")} />
      <button type="submit" className={btnPrimary}>Ekle</button>
      <button type="button" onClick={() => setShow(false)} className={btn}>Vazgeç</button>
      {err && <p className="w-full text-xs text-rose-700">{err}</p>}
    </form>
  );
}

/* ───────────────────────── Kontenjan düzenleyici ───────────────────────── */

function CapacityEditor({ config, months, onSaved }: { config: AiCapacityConfig; months: AiCapacityInfo[]; onSaved: () => void }) {
  const [def, setDef] = useState(String(config.defaultPerMonth));
  const [gift, setGift] = useState(String(config.droneGiftLeft ?? 10));
  const [totals, setTotals] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(config.months).map(([k, v]) => [k, String(v)]))
  );
  const [manual, setManual] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(config.manualBooked).map(([k, v]) => [k, String(v)]))
  );
  const [saved, setSaved] = useState(false);
  const [perDay, setPerDay] = useState(String(config.perDay ?? 1));
  const [blocked, setBlocked] = useState<string[]>(config.blockedDates ?? []);
  const [newBlock, setNewBlock] = useState("");

  const toNums = (m: Record<string, string>) =>
    Object.fromEntries(Object.entries(m).filter(([, v]) => v.trim() !== "").map(([k, v]) => [k, Number(v)]));

  return (
    <AdminSection title="Kontenjan" description="Kalan yer = aylık kapasite − onaylı rezervasyonlar − elle düşülen. Sesli asistan ve takip mesajları bu rakamı söyler — sadece GERÇEK rezervasyonları girin (yanıltıcı kıtlık reklamı yasal risk).">
      <div className="flex flex-wrap items-end gap-3">
        <label className="text-xs font-medium text-slate-600">
          Aylık varsayılan kapasite (çift)
          <input type="number" min={0} max={200} value={def} onChange={(e) => setDef(e.target.value)} className={cn(field, "mt-1 w-28")} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Aynı gün en fazla kaç düğün
          <input type="number" min={1} max={10} value={perDay} onChange={(e) => setPerDay(e.target.value)} className={cn(field, "mt-1 w-28")} />
        </label>
        <label className="text-xs font-medium text-slate-600">
          Drone hediyesi kalan
          <input type="number" min={0} max={100} value={gift} onChange={(e) => setGift(e.target.value)} className={cn(field, "mt-1 w-28")} />
        </label>
        <button
          type="button"
          className={cn(btnPrimary, "h-10 px-4")}
          onClick={async () => {
            const res = await fetch("/api/admin/ai-capacity", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ defaultPerMonth: Number(def), droneGiftLeft: Number(gift), perDay: Number(perDay), blockedDates: blocked, months: toNums(totals), manualBooked: toNums(manual) }),
            }).catch(() => null);
            if (!res?.ok) return alert("Kontenjan kaydedilemedi — tekrar deneyin");
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            onSaved();
          }}
        >
          {saved ? "Kaydedildi ✓" : "Kaydet"}
        </button>
      </div>
      <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-3">
        <p className="text-xs font-semibold text-slate-700">Kapalı günler</p>
        <p className="text-[11px] text-slate-500">Takvime girmemiş iş, izin vb. Asistan bu günlere &quot;dolu&quot; der. (Rezervasyonu olan günler zaten otomatik dolu sayılır.)</p>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input type="date" value={newBlock} onChange={(e) => setNewBlock(e.target.value)} className={cn(field, "h-9 w-44")} />
          <button
            type="button"
            disabled={!newBlock || blocked.includes(newBlock)}
            onClick={() => { setBlocked([...blocked, newBlock].sort()); setNewBlock(""); }}
            className={btn}
          >
            <Plus className="h-3.5 w-3.5" /> Günü kapat
          </button>
          {blocked.map((d) => (
            <span key={d} className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-700">
              {d.split("-").reverse().join(".")}
              <button type="button" aria-label="Kaldır" onClick={() => setBlocked(blocked.filter((x) => x !== d))} className="text-slate-400 hover:text-rose-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <p className="mt-1.5 text-[11px] text-slate-500">Değişiklikten sonra yukarıdaki <b>Kaydet</b>&apos;e basın.</p>
      </div>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full min-w-[560px] text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-[11px] font-semibold tracking-[0.06em] text-slate-500 uppercase">
              <th className="px-3 py-2.5">Ay</th>
              <th className="px-3">Kapasite</th>
              <th className="px-3">Rezervasyon + elle</th>
              <th className="px-3">Elle dolu</th>
              <th className="px-3">Kalan</th>
              <th className="w-32 px-3">Doluluk</th>
            </tr>
          </thead>
          <tbody>
            {months.map((w) => {
              const pct = w.total ? Math.round(((w.total - w.remaining) / w.total) * 100) : 0;
              return (
                <tr key={w.monthKey} className="border-t border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-800">{w.monthLabel}</td>
                  <td className="px-3">
                    <input type="number" min={0} max={200} placeholder={def} value={totals[w.monthKey] ?? ""} onChange={(e) => setTotals({ ...totals, [w.monthKey]: e.target.value })} className={cn(field, "h-8 w-20")} />
                  </td>
                  <td className="px-3 text-slate-600 tabular-nums">{w.booked}</td>
                  <td className="px-3">
                    <input type="number" min={0} max={200} placeholder="0" value={manual[w.monthKey] ?? ""} onChange={(e) => setManual({ ...manual, [w.monthKey]: e.target.value })} className={cn(field, "h-8 w-20")} />
                  </td>
                  <td className={cn("px-3 font-semibold tabular-nums", w.remaining <= 1 ? "text-rose-700" : "text-slate-900")}>{w.remaining}</td>
                  <td className="px-3">
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div className={cn("h-full rounded-full", w.remaining <= 2 ? "bg-rose-500" : "bg-indigo-500")} style={{ width: `${pct}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AdminSection>
  );
}

/* ───────────────────────── Entegrasyon ───────────────────────── */

function IntegrationBox({ integration }: { integration: Payload["integration"] }) {
  const [show, setShow] = useState(false);
  const [tg, setTg] = useState<string | null>(null);
  const [botToken, setBotToken] = useState("");
  const base = integration.baseUrl;
  const endpoints = [
    ["POST", "/api/ai/couples", "Yeni çift (Düğün.com / Meta form)"],
    ["GET", "/api/ai/queue", "Şimdi yapılacak arama ve mesajlar"],
    ["GET", "/api/ai/couples/{id}/can-contact?channel=call", "Aramadan önce izin kontrolü"],
    ["POST", "/api/ai/couples/{id}/calls", "Arama sonucu, özet, ses kaydı"],
    ["POST", "/api/ai/couples/{id}/messages", "WhatsApp mesajı (giden: önce izin, gelen: niyet)"],
    ["PATCH", "/api/ai/couples/{id}", "Durum: thinking, no_reply, won…"],
    ["GET", "/api/ai/capacity?date=YYYY-MM-DD", "Gerçek kalan kontenjan"],
    ["POST", "/api/ai/report", "Akşam raporunu Telegram'a gönder"],
    ["POST", "/api/telegram/webhook", "Telegram komutları (sesli komut: n8n → { text })"],
  ];
  return (
    <AdminSection title="Entegrasyon (n8n · sesli asistan · Telegram)" description="n8n isteklerinde başlık: Authorization: Bearer <anahtar>. Anahtarı kimseyle paylaşmayın.">
      <div className="flex flex-wrap items-center gap-2">
        <code className="flex-1 truncate rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
          {show ? integration.apiToken : "•".repeat(32)}
        </code>
        <button type="button" onClick={() => setShow(!show)} className={btn} aria-label="Anahtarı göster">
          {show ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
        </button>
        <button type="button" onClick={() => navigator.clipboard?.writeText(integration.apiToken)} className={btn} aria-label="Kopyala">
          <Copy className="h-3.5 w-3.5" />
        </button>
      </div>
      <details className="mt-4 text-xs">
        <summary className="cursor-pointer font-semibold text-indigo-600">Uç noktalar ({endpoints.length})</summary>
        <ul className="mt-2 space-y-1.5">
          {endpoints.map(([m, p, d]) => (
            <li key={p} className="flex flex-wrap gap-x-2">
              <span className="w-12 font-semibold text-indigo-600">{m}</span>
              <code className="text-slate-700">{base}{p}</code>
              <span className="text-slate-500">— {d}</span>
            </li>
          ))}
        </ul>
      </details>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder={integration.telegramReady ? "Bot ayarlı — değiştirmek için yeni anahtar" : "BotFather'dan aldığın bot anahtarı (123456:AA…)"}
          className={cn(field, "min-w-[16rem] flex-1 text-xs")}
          autoComplete="off"
        />
        <button
          type="button"
          disabled={!integration.telegramReady && !botToken.trim()}
          onClick={async () => {
            setTg("Bağlanıyor…");
            const res = await fetch("/api/admin/ai-telegram", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(botToken.trim() ? { token: botToken.trim() } : {}),
            });
            const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
            if (j.ok) setBotToken("");
            setTg(j.ok ? "✅ Bağlandı — Telegram'a test mesajı gitti" : `⚠️ ${j.error ?? "Bağlanamadı"}`);
          }}
          className={btnPrimary}
        >
          <Send className="h-3.5 w-3.5" /> {"Telegram'ı bağla"}
        </button>
      </div>
      <p className="mt-2 text-xs text-slate-500">
        {tg ?? (integration.telegramReady ? "Bot ayarlı" : "1) Telegram'da @BotFather → /newbot  2) Verdiği anahtarı buraya yapıştır  3) Kendi botuna /start yaz  4) Butona bas")}
      </p>
    </AdminSection>
  );
}
