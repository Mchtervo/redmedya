"use client";

/**
 * AI Komuta Merkezi — Bento kartları (KPI'lar, haftalık trend, kontenjan halkası, aktif ajanlar).
 * Dashboard ve AI Çift Yönetimi sayfası aynı bileşenleri kullanır. Sadece okuma + mevcut
 * kampanya başlat/durdur uç noktası; veri yapısına dokunmaz.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowRight, ArrowUpRight, CalendarHeart, Flame, MessageCircle, Mic, PhoneCall, Send } from "lucide-react";
import type { AiCapacityInfo, AiCouple } from "@/types/ai-couples";
import { cn } from "@/lib/utils";
import { useAiSystemStatus, type AiSystemStatus } from "@/hooks/use-ai-system-status";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";

const TZ = "Europe/Istanbul";
const dayKey = (d: Date | string) => new Date(d).toLocaleDateString("sv-SE", { timeZone: TZ });
const GUN = ["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"];

/** Grafik renkleri (açık zemin için doğrulandı: indigo + mercan, CVD ΔE 25) */
const C_CALL = "#4F46E5";
const C_WA = "#E11D48";

function lastDays(n: number, now = new Date()) {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(now.getTime() - (n - 1 - i) * 86_400_000);
    return { key: dayKey(d), label: GUN[Number(new Date(d.toLocaleString("en-US", { timeZone: TZ })).getDay())] };
  });
}

export function useAiStats(allCouples: AiCouple[]) {
  return useMemo(() => {
    const couples = allCouples.filter((c) => c.sourceRef !== "test" && !/^TEST\s/.test(c.name));
    const days = lastDays(7);
    const calls: Record<string, number> = {};
    const wa: Record<string, number> = {};
    const replies: Record<string, number> = {};
    let waCouples = 0;
    let waToday = 0;
    let needsReply = 0;
    const today = days[6].key;
    for (const c of couples) {
      for (const x of c.calls) {
        const k = dayKey(x.at);
        calls[k] = (calls[k] ?? 0) + 1;
      }
      let sentWa = false;
      for (const m of c.messages) {
        const k = dayKey(m.at);
        if (m.direction === "out" && m.channel === "whatsapp") {
          wa[k] = (wa[k] ?? 0) + 1;
          sentWa = true;
          if (k === today) waToday++;
        }
        if (m.direction === "in") replies[k] = (replies[k] ?? 0) + 1;
      }
      if (sentWa) waCouples++;
      if (c.messages.at(-1)?.direction === "in" && !c.contactLocked) needsReply++;
    }
    const series = days.map((d) => ({ ...d, calls: calls[d.key] ?? 0, wa: wa[d.key] ?? 0, replies: replies[d.key] ?? 0 }));
    return {
      series,
      callsToday: series[6].calls,
      callsYesterday: series[5].calls,
      waCouples,
      waToday,
      hot: couples.filter((c) => c.grade === "hot" && !c.contactLocked).length,
      needsReply,
    };
  }, [allCouples]);
}

/* ───────────────────────── KPI kartları ───────────────────────── */

type Kpi = {
  label: string;
  value: string | number;
  icon: typeof PhoneCall;
  iconTone: string;
  badge?: { text: string; tone: "up" | "down" | "flat" | "alert" | "info" };
  hint?: string;
  onClick?: () => void;
};

const BADGE_TONE = {
  up: "bg-emerald-50 text-emerald-700",
  down: "bg-rose-50 text-rose-700",
  flat: "bg-slate-100 text-slate-600",
  alert: "bg-rose-600 text-white",
  info: "bg-indigo-50 text-indigo-700",
} as const;

function KpiCard({ k }: { k: Kpi }) {
  const Icon = k.icon;
  const Arrow = k.badge?.tone === "up" ? ArrowUpRight : k.badge?.tone === "down" ? ArrowDownRight : null;
  const Tag = k.onClick ? "button" : "div";
  return (
    <Tag
      {...(k.onClick ? { type: "button" as const, onClick: k.onClick } : {})}
      className="rm-card rm-card-hover group flex min-w-0 flex-col p-3.5 text-left sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 sm:h-11 sm:w-11", k.iconTone)}>
          <Icon className="h-5 w-5" strokeWidth={1.8} />
        </span>
        {k.badge && (
          <span className={cn("inline-flex max-w-full items-center gap-0.5 truncate rounded-full px-2 py-1 text-[10px] font-semibold whitespace-nowrap sm:text-[11px]", BADGE_TONE[k.badge.tone])}>
            {Arrow && <Arrow className="h-3 w-3" strokeWidth={2.2} />}
            {k.badge.text}
          </span>
        )}
      </div>
      <p className="mt-3 text-xs font-medium text-slate-500 sm:mt-4 sm:text-[13px]">{k.label}</p>
      <p className="mt-0.5 font-editorial text-2xl leading-none text-slate-900 tabular-nums sm:text-[2rem]">{k.value}</p>
      {k.hint && <p className="mt-2 hidden text-xs text-slate-500 sm:block">{k.hint}</p>}
    </Tag>
  );
}

function pctBadge(today: number, yesterday: number): Kpi["badge"] {
  if (!yesterday) return today ? { text: `${today} yeni`, tone: "up" } : { text: "dün 0", tone: "flat" };
  if (!today) return { text: `dün ${yesterday}`, tone: "flat" };
  const p = Math.round(((today - yesterday) / yesterday) * 100);
  return { text: `${p > 0 ? "+" : ""}${p}% düne göre`, tone: p > 0 ? "up" : p < 0 ? "down" : "flat" };
}

/** Kontenjan özeti: önümüzdeki aylar toplamı */
function capacityTotals(months: AiCapacityInfo[]) {
  const total = months.reduce((s, m) => s + m.total, 0);
  const remaining = months.reduce((s, m) => s + m.remaining, 0);
  return { total, remaining, filled: total ? Math.round(((total - remaining) / total) * 100) : 0 };
}

export function AiKpiRow({
  couples,
  months,
  onOpenStage,
}: {
  couples: AiCouple[];
  months: AiCapacityInfo[];
  /** Karta tıklayınca AI sayfasında ilgili filtreye gitmek için */
  onOpenStage?: (what: "calls" | "whatsapp" | "hot" | "capacity") => void;
}) {
  const st = useAiStats(couples);
  const cap = capacityTotals(months);
  const kpis: Kpi[] = [
    {
      label: "Bugün arananlar",
      value: st.callsToday,
      icon: PhoneCall,
      iconTone: "bg-indigo-50 text-indigo-600",
      badge: pctBadge(st.callsToday, st.callsYesterday),
      hint: `Dün: ${st.callsYesterday} arama`,
      onClick: onOpenStage && (() => onOpenStage("calls")),
    },
    {
      label: "WhatsApp teklifi gidenler",
      value: st.waCouples,
      icon: Send,
      iconTone: "bg-emerald-50 text-emerald-600",
      badge: st.waToday ? { text: `+${st.waToday} bugün`, tone: "up" } : { text: "bugün 0", tone: "flat" },
      hint: "En az bir WhatsApp mesajı giden çift",
      onClick: onOpenStage && (() => onOpenStage("whatsapp")),
    },
    {
      label: "🔥 Sıcak adaylar",
      value: st.hot,
      icon: Flame,
      iconTone: "bg-rose-50 text-rose-600",
      badge: st.needsReply ? { text: `${st.needsReply} cevap bekliyor`, tone: "alert" } : { text: "bekleyen yok", tone: "flat" },
      hint: "İlgili / tarih tutmak isteyen çiftler",
      onClick: onOpenStage && (() => onOpenStage("hot")),
    },
    {
      label: "Kalan kontenjan",
      value: `${cap.remaining} yer`,
      icon: CalendarHeart,
      iconTone: "bg-amber-50 text-amber-600",
      badge: { text: `%${cap.filled} dolu`, tone: "info" },
      hint: `Önümüzdeki ${months.length} ay · toplam ${cap.total}`,
      onClick: onOpenStage && (() => onOpenStage("capacity")),
    },
  ];
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
      {kpis.map((k) => (
        <KpiCard key={k.label} k={k} />
      ))}
    </div>
  );
}

/* ───────────────────────── Haftalık trend (yumuşak alan grafiği) ───────────────────────── */

/** Catmull-Rom → kübik Bezier: noktalardan geçen yumuşak eğri */
function smoothPath(pts: [number, number][]) {
  if (pts.length < 2) return "";
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const t = 0.18;
    const c1: [number, number] = [p1[0] + (p2[0] - p0[0]) * t, p1[1] + (p2[1] - p0[1]) * t];
    const c2: [number, number] = [p2[0] - (p3[0] - p1[0]) * t, p2[1] - (p3[1] - p1[1]) * t];
    d += ` C${c1[0]},${c1[1]} ${c2[0]},${c2[1]} ${p2[0]},${p2[1]}`;
  }
  return d;
}

export function AiTrendChart({ couples }: { couples: AiCouple[] }) {
  const { series } = useAiStats(couples);
  const [hover, setHover] = useState<number | null>(null);
  const W = 640, H = 240, L = 34, R = 12, T = 16, B = 30;
  const max = Math.max(4, ...series.map((s) => Math.max(s.calls, s.wa)));
  const niceMax = Math.ceil(max / 4) * 4;
  const x = (i: number) => L + (i * (W - L - R)) / (series.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / niceMax);
  const ticks = [0, niceMax / 4, niceMax / 2, (3 * niceMax) / 4, niceMax];
  const lines = [
    { key: "calls" as const, name: "Aramalar", color: C_CALL },
    { key: "wa" as const, name: "WhatsApp mesajı", color: C_WA },
  ];
  const totals = { calls: series.reduce((s, d) => s + d.calls, 0), wa: series.reduce((s, d) => s + d.wa, 0), replies: series.reduce((s, d) => s + d.replies, 0) };

  return (
    <section className="rm-card p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="font-editorial text-lg text-slate-900">Haftalık arama & mesaj trendi</h3>
          <p className="text-xs text-slate-500">Son 7 gün · toplam {totals.calls} arama, {totals.wa} WhatsApp, {totals.replies} çift cevabı</p>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-slate-600">
          {lines.map((l) => (
            <span key={l.key} className="inline-flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: l.color }} />
              {l.name}
            </span>
          ))}
        </div>
      </div>

      <div className="relative mt-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Son 7 günün arama ve WhatsApp sayıları">
          <defs>
            {lines.map((l) => (
              <linearGradient key={l.key} id={`rm-grad-${l.key}`} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor={l.color} stopOpacity="0.22" />
                <stop offset="100%" stopColor={l.color} stopOpacity="0" />
              </linearGradient>
            ))}
          </defs>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#EEF2F6" strokeWidth={1} />
              <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#94A3B8">{t}</text>
            </g>
          ))}
          {series.map((d, i) => (
            <text key={d.key} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill={i === series.length - 1 ? "#0F172A" : "#94A3B8"} fontWeight={i === series.length - 1 ? 600 : 400}>
              {i === series.length - 1 ? "Bugün" : d.label}
            </text>
          ))}
          {lines.map((l) => {
            const pts = series.map((d, i) => [x(i), y(d[l.key])] as [number, number]);
            const path = smoothPath(pts);
            return (
              <g key={l.key}>
                <path d={`${path} L${x(series.length - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={`url(#rm-grad-${l.key})`} />
                <path d={path} fill="none" stroke={l.color} strokeWidth={2} strokeLinecap="round" />
              </g>
            );
          })}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={T} y2={y(0)} stroke="#CBD5E1" strokeDasharray="3 3" />
              {lines.map((l) => (
                <circle key={l.key} cx={x(hover)} cy={y(series[hover][l.key])} r={5} fill={l.color} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}
          {series.map((d, i) => (
            <rect
              key={d.key}
              x={x(i) - (W - L - R) / (series.length - 1) / 2}
              y={T}
              width={(W - L - R) / (series.length - 1)}
              height={H - T - B}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={() => setHover(i)}
            />
          ))}
        </svg>
        {hover !== null && (
          <div
            className="pointer-events-none absolute top-1 z-10 -translate-x-1/2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur"
            style={{ left: `${(x(hover) / W) * 100}%` }}
          >
            <p className="font-semibold text-slate-900">{hover === series.length - 1 ? "Bugün" : series[hover].label} · {series[hover].key.slice(5).split("-").reverse().join(".")}</p>
            {lines.map((l) => (
              <p key={l.key} className="mt-0.5 flex items-center gap-1.5 text-slate-600">
                <span className="h-2 w-2 rounded-full" style={{ background: l.color }} />
                {l.name}: <b className="text-slate-900 tabular-nums">{series[hover][l.key]}</b>
              </p>
            ))}
            <p className="mt-0.5 text-slate-500">Çift cevabı: <b className="text-slate-900 tabular-nums">{series[hover].replies}</b></p>
          </div>
        )}
        <table className="sr-only">
          <caption>Son 7 gün</caption>
          <thead><tr><th>Gün</th><th>Arama</th><th>WhatsApp</th><th>Cevap</th></tr></thead>
          <tbody>{series.map((d) => <tr key={d.key}><td>{d.key}</td><td>{d.calls}</td><td>{d.wa}</td><td>{d.replies}</td></tr>)}</tbody>
        </table>
      </div>
    </section>
  );
}

/* ───────────────────────── Kontenjan halkası ───────────────────────── */

export function AiCapacityDonut({ months }: { months: AiCapacityInfo[] }) {
  const options = months.filter((m) => m.total > 0);
  const [key, setKey] = useState<string | null>(null);
  // Varsayılan: en az yeri kalan yakın ay (en kritik)
  const critical = [...options].sort((a, b) => a.remaining - b.remaining || a.monthKey.localeCompare(b.monthKey))[0];
  const m = options.find((o) => o.monthKey === key) ?? critical;
  if (!m) {
    return (
      <section className="rm-card p-4 sm:p-5">
        <h3 className="font-editorial text-lg text-slate-900">Aylık doluluk</h3>
        <p className="mt-2 text-sm text-slate-500">Kontenjan tanımlı değil.</p>
      </section>
    );
  }
  const filled = m.total - m.remaining;
  const pct = m.total ? Math.round((filled / m.total) * 100) : 0;
  const r = 52, circ = 2 * Math.PI * r;
  const tone = m.remaining <= 2 ? "#E11D48" : "#4F46E5";
  return (
    <section className="rm-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-editorial text-lg text-slate-900">Aylık doluluk</h3>
        <select
          value={m.monthKey}
          onChange={(e) => setKey(e.target.value)}
          className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs font-medium text-slate-700 outline-none"
          aria-label="Ay seç"
        >
          {options.map((o) => (
            <option key={o.monthKey} value={o.monthKey}>{o.monthLabel}</option>
          ))}
        </select>
      </div>
      <div className="mt-3 flex items-center gap-5">
        <div className="relative h-32 w-32 shrink-0">
          <svg viewBox="0 0 128 128" className="h-full w-full -rotate-90" role="img" aria-label={`${m.monthLabel}: yüzde ${pct} dolu`}>
            <circle cx="64" cy="64" r={r} fill="none" stroke="#EEF2F6" strokeWidth="12" />
            <circle
              cx="64" cy="64" r={r} fill="none" stroke={tone} strokeWidth="12" strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * circ} ${circ}`}
              style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-editorial text-2xl text-slate-900 tabular-nums">%{pct}</span>
            <span className="text-[11px] text-slate-500">dolu</span>
          </div>
        </div>
        <div className="min-w-0 space-y-1.5 text-sm">
          <p className="font-semibold text-slate-900">{m.monthLabel}</p>
          <p className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", m.remaining <= 2 ? "bg-rose-50 text-rose-700" : "bg-indigo-50 text-indigo-700")}>
            {m.remaining === 0 ? "Kontenjan doldu" : `Son ${m.remaining} kontenjan`}
          </p>
          <p className="text-xs text-slate-500">{filled} dolu / {m.total} toplam</p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Aktif AI ajanları ───────────────────────── */

function Working({ on }: { on: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", on ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500")}>
      {on ? (
        <span className="flex h-3 items-end gap-[2px]" aria-hidden>
          {[0, 1, 2].map((i) => (
            <span key={i} className="w-[3px] animate-pulse rounded-full bg-emerald-500" style={{ height: `${6 + i * 3}px`, animationDelay: `${i * 0.2}s` }} />
          ))}
        </span>
      ) : (
        <span className="h-2 w-2 rounded-full bg-slate-400" />
      )}
      {on ? "Çalışıyor" : "Durdu"}
    </span>
  );
}

export function AiAgentsCard({ status, onToggle, onOpen, horizontal }: {
  /** AI sayfasında 3 ajan yan yana (geniş ekran) */
  horizontal?: boolean;
  status: AiSystemStatus;
  /** Verilirse başlat/durdur düğmeleri görünür (AI sayfası) */
  onToggle?: (target: "kampanya" | "arama", on: boolean) => void;
  onOpen?: () => void;
}) {
  const agents = [
    { id: "arama" as const, name: "Sesli Asistan", desc: `Otomatik arama · bugün ${status.bugunArama ?? 0} arama`, icon: Mic, tone: "bg-indigo-50 text-indigo-600", on: !!status.arama, toggle: true },
    { id: "wa" as const, name: "WhatsApp Hattı", desc: status.whatsapp === undefined ? "Durum bilinmiyor" : status.whatsapp ? "0540 hattı bağlı" : "Hat kopuk — QR gerekli olabilir", icon: MessageCircle, tone: "bg-emerald-50 text-emerald-600", on: !!status.whatsapp, toggle: false },
    { id: "kampanya" as const, name: "Kampanya Kuyruğu", desc: `2027 kampanyası · bugün ${status.bugunWhatsapp ?? 0}/25`, icon: Send, tone: "bg-rose-50 text-rose-600", on: !!status.kampanya, toggle: true },
  ];
  return (
    <section className="rm-card p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-editorial text-lg text-slate-900">Aktif AI ajanları</h3>
        {onOpen && (
          <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:underline">
            Yönet <ArrowRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {status.error && <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">⚠️ {status.error}</p>}
      <ul className={cn("mt-3 gap-2.5", horizontal ? "grid lg:grid-cols-3" : "space-y-2.5")}>
        {agents.map((a) => {
          const Icon = a.icon;
          return (
            <li key={a.id} className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-3 transition-colors hover:border-indigo-100 hover:bg-white">
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", a.tone)}>
                <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">{a.name}</p>
                <p className="line-clamp-2 text-xs text-slate-500">{a.desc}</p>
              </div>
              {status.n8n === undefined ? (
                <span className="text-xs text-slate-400">…</span>
              ) : (
                <div className="ml-auto flex shrink-0 items-center gap-2">
                  <Working on={a.on} />
                  {onToggle && a.toggle && a.id !== "wa" && (
                    <button
                      type="button"
                      onClick={() => onToggle(a.id as "kampanya" | "arama", !a.on)}
                      className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-semibold transition-colors",
                        a.on ? "border border-slate-200 bg-white text-slate-700 hover:border-rose-200 hover:text-rose-700" : "bg-indigo-600 text-white hover:bg-indigo-700"
                      )}
                    >
                      {a.on ? "Durdur" : "Başlat"}
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* ───────────────────────── Görüşme istatistikleri (bugün / hafta / ay / yıl) ───────────────────────── */

type Period = "today" | "week" | "month" | "year";
const PERIOD_LABEL: Record<Period, string> = { today: "Bugün", week: "Bu hafta", month: "Bu ay", year: "Bu yıl" };

function periodStart(p: Period, now = new Date()): string {
  const today = dayKey(now);
  if (p === "today") return today;
  if (p === "month") return `${today.slice(0, 7)}-01`;
  if (p === "year") return `${today.slice(0, 4)}-01-01`;
  const local = new Date(now.toLocaleString("en-US", { timeZone: TZ }));
  const sinceMonday = (local.getDay() + 6) % 7;
  return dayKey(new Date(now.getTime() - sinceMonday * 86_400_000));
}

/** Çiftin rezervasyona döndüğü an: zaman çizelgesindeki "won" kaydı; yoksa (eski kayıtlar) son güncelleme */
function wonAt(c: AiCouple): string | null {
  if (c.status !== "won") return null;
  const t = [...c.timeline].reverse().find((e) => e.type === "won");
  return t?.at ?? c.updatedAt;
}

export function computeStats(allCouples: AiCouple[], reservations: { approvedAt?: string; createdAt?: string }[], p: Period) {
  const couples = allCouples.filter((c) => c.sourceRef !== "test" && !/^TEST\s/.test(c.name));
  const start = periodStart(p);
  const inP = (iso?: string) => Boolean(iso) && dayKey(iso!) >= start;
  let calls = 0, answeredCalls = 0, seconds = 0;
  let calledCouples = 0, reachedCouples = 0, waCouples = 0, waRepliedCouples = 0, touched = 0, won = 0;
  for (const c of couples) {
    const pc = c.calls.filter((x) => inP(x.at));
    const answered = pc.filter((x) => x.outcome !== "no_answer");
    calls += pc.length;
    answeredCalls += answered.length;
    seconds += answered.reduce((s, x) => s + (x.durationSec ?? 0), 0);
    if (pc.length) calledCouples++;
    if (answered.length) reachedCouples++;
    const pm = c.messages.filter((m) => m.channel === "whatsapp" && inP(m.at));
    if (pm.length) waCouples++;
    if (pm.some((m) => m.direction === "in")) waRepliedCouples++;
    if (pc.length || pm.some((m) => m.direction === "out")) touched++;
    if (inP(wonAt(c) ?? undefined)) won++;
  }
  const newReservations = reservations.filter((r) => inP(r.approvedAt || r.createdAt)).length;
  return {
    calls, answeredCalls, calledCouples, reachedCouples, waCouples, waRepliedCouples, touched, won, newReservations,
    minutes: Math.round(seconds / 60),
    avgMinutes: answeredCalls ? Math.round((seconds / answeredCalls / 60) * 10) / 10 : 0,
    conversion: touched ? Math.round((won / touched) * 1000) / 10 : 0,
    reachRate: calledCouples ? Math.round((reachedCouples / calledCouples) * 100) : 0,
  };
}

export function AiStatsCard({ couples, reservations }: { couples: AiCouple[]; reservations: { approvedAt?: string; createdAt?: string }[] }) {
  const [p, setP] = useState<Period>("week");
  const s = useMemo(() => computeStats(couples, reservations, p), [couples, reservations, p]);
  const tiles = [
    { label: "Aranan çift", value: s.calledCouples, sub: `${s.calls} arama yapıldı` },
    { label: "Görüşülen çift", value: s.reachedCouples, sub: `açılma oranı %${s.reachRate}` },
    { label: "Görüşme süresi", value: `${s.minutes} dk`, sub: s.answeredCalls ? `ortalama ${s.avgMinutes} dk / görüşme` : "henüz görüşme yok" },
    { label: "WhatsApp'ta yazışılan", value: s.waCouples, sub: `${s.waRepliedCouples} çift cevap yazdı` },
  ];
  const funnel = [
    { label: "Ulaşılan çift (arama veya WhatsApp)", value: s.touched, color: "bg-indigo-500" },
    { label: "Telefonda görüşülen", value: s.reachedCouples, color: "bg-blue-500" },
    { label: "WhatsApp'ta cevap veren", value: s.waRepliedCouples, color: "bg-emerald-500" },
    { label: "Rezervasyona dönen", value: s.won, color: "bg-rose-500" },
  ];
  const max = Math.max(1, s.touched);
  return (
    <section className="rm-card p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-editorial text-lg text-slate-900">Görüşme istatistikleri</h3>
          <p className="text-xs text-slate-500">Sesli asistan + WhatsApp · {PERIOD_LABEL[p].toLocaleLowerCase("tr-TR")}</p>
        </div>
        <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Dönem">
          {(Object.keys(PERIOD_LABEL) as Period[]).map((k) => (
            <button
              key={k}
              type="button"
              role="tab"
              aria-selected={p === k}
              onClick={() => setP(k)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                p === k ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800"
              )}
            >
              {PERIOD_LABEL[k]}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        {tiles.map((t) => (
          <div key={t.label} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5 transition-colors hover:border-indigo-100 hover:bg-white">
            <p className="text-xs font-medium text-slate-500">{t.label}</p>
            <p className="mt-1 font-editorial text-2xl leading-none text-slate-900 tabular-nums">{t.value}</p>
            <p className="mt-1.5 text-[11px] text-slate-500">{t.sub}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-2.5">
          {funnel.map((f) => {
            const pct = s.touched ? Math.round((f.value / s.touched) * 100) : 0;
            return (
              <div key={f.label}>
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-slate-600">{f.label}</span>
                  <span className="font-semibold text-slate-900 tabular-nums">
                    {f.value} <span className="font-normal text-slate-400">· %{pct}</span>
                  </span>
                </div>
                <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className={cn("h-full rounded-full transition-[width] duration-700 ease-out", f.color)} style={{ width: `${(f.value / max) * 100}%` }} />
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex flex-col justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-600 p-4 text-white">
          <p className="text-xs font-medium text-indigo-100">Rezervasyona dönüş oranı</p>
          <p className="mt-1 font-editorial text-4xl leading-none tabular-nums">%{s.conversion}</p>
          <p className="mt-2 text-xs text-indigo-100">
            {s.touched} ulaşılan çiftten {s.won} rezervasyon
          </p>
          <p className="mt-3 border-t border-white/20 pt-2 text-xs text-indigo-100">
            Takvime eklenen rezervasyon (tüm kaynaklar): <b className="text-white tabular-nums">{s.newReservations}</b>
          </p>
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── Dashboard için hazır blok ───────────────────────── */

type AiPayload = { couples: AiCouple[]; months: AiCapacityInfo[] };

export function AiCommandCenter({
  onOpenAi,
  reservations = [],
}: {
  onOpenAi: () => void;
  /** Takvimdeki rezervasyonlar (dönüşüm istatistiği için) */
  reservations?: { approvedAt?: string; createdAt?: string }[];
}) {
  const [data, setData] = useState<AiPayload | null>(null);
  const { status } = useAiSystemStatus();
  const load = useCallback(() => {
    fetch("/api/admin/ai-couples")
      .then((r) => (r.ok ? r.json() : null))
      .then((d: AiPayload | null) => setData(d))
      .catch(() => setData(null));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useAdminDataSync(load);

  if (!data) {
    return (
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="rm-card h-40 animate-pulse" />
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <AiKpiRow couples={data.couples} months={data.months} onOpenStage={onOpenAi} />
      <AiStatsCard couples={data.couples} reservations={reservations} />
      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <AiTrendChart couples={data.couples} />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <AiCapacityDonut months={data.months} />
          <AiAgentsCard status={status} onOpen={onOpenAi} />
        </div>
      </div>
    </div>
  );
}
