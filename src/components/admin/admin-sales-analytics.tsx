"use client";

/**
 * Satış Analizi: kaynak (Düğün.com / Instagram-Facebook / web) ve reklam bazında huni,
 * sonuç dağılımı, rezervasyon + ciro eşleşmesi ve öneriler. Sadece okuma.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { Lightbulb, TrendingUp } from "lucide-react";
import { cn, formatPrice } from "@/lib/utils";
import { AdminPanelHeader, AdminSection } from "@/components/admin/admin-panel-header";
import { useAdminDataSync } from "@/hooks/use-admin-data-sync";
import type { AiCouple, AiCoupleSource } from "@/types/ai-couples";
import type { ReservationRecord } from "@/types/reservations";
import {
  adOf,
  adviceFor,
  attributeReservations,
  funnel,
  OUTCOME_TEXT,
  SOURCE_TEXT,
  type FunnelRow,
  type Outcome,
} from "@/lib/ai-couples/analytics";

type Period = "month" | "quarter" | "year" | "all";
const PERIOD: Record<Period, string> = { month: "Bu ay", quarter: "Son 3 ay", year: "Bu yıl", all: "Tümü" };

function periodStart(p: Period): number {
  const now = new Date();
  if (p === "all") return 0;
  if (p === "month") return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  if (p === "year") return new Date(now.getFullYear(), 0, 1).getTime();
  return now.getTime() - 92 * 86_400_000;
}

/** Sonuçları 4 renk grubuna topla (çok renk okunmaz) */
const GROUPS: { key: string; label: string; color: string; items: Outcome[] }[] = [
  { key: "won", label: "Rezervasyon", color: "#059669", items: ["won"] },
  { key: "open", label: "Süren (görüşülüyor / düşünüyor / bizden cevap bekliyor)", color: "#4F46E5", items: ["in_talks", "thinking", "waiting_us"] },
  { key: "lost", label: "Kaybedilen (başka firma / ilgilenmiyor / istemiyor)", color: "#E11D48", items: ["booked_elsewhere", "lost", "stopped"] },
  { key: "none", label: "Dönmeyen / henüz ulaşılmayan", color: "#94A3B8", items: ["no_response", "not_contacted"] },
];

const pct = (a: number, b: number) => (b ? `%${Math.round((a / b) * 100)}` : "—");
const mins = (m: number | null) => (m === null ? "—" : m < 60 ? `${Math.round(m)} dk` : m < 1440 ? `${Math.round(m / 60)} sa` : `${Math.round(m / 1440)} gün`);

export function AdminSalesAnalytics() {
  const [couples, setCouples] = useState<AiCouple[] | null>(null);
  const [reservations, setReservations] = useState<ReservationRecord[]>([]);
  const [p, setP] = useState<Period>("all");

  const load = useCallback(() => {
    Promise.all([
      fetch("/api/admin/ai-couples").then((r) => (r.ok ? r.json() : { couples: [] })),
      fetch("/api/admin/reservations").then((r) => (r.ok ? r.json() : [])),
    ])
      .then(([a, res]) => {
        // Test çiftleri (panelden test araması) istatistiğe girmez
        setCouples(((a as { couples?: AiCouple[] }).couples ?? []).filter((c) => c.sourceRef !== "test" && !/^TEST\s/.test(c.name)));
        setReservations(Array.isArray(res) ? res : []);
      })
      .catch(() => setCouples([]));
  }, []);
  useEffect(() => {
    load();
  }, [load]);
  useAdminDataSync(load);

  const data = useMemo(() => {
    if (!couples) return null;
    const start = periodStart(p);
    const list = couples.filter((c) => Date.parse(c.createdAt) >= start);
    const resList = reservations.filter((r) => Date.parse(r.approvedAt || r.createdAt) >= start);
    const { revenueByCouple, rows: resRows } = attributeReservations(couples, resList);

    const sources = (Object.keys(SOURCE_TEXT) as AiCoupleSource[])
      .map((s) => funnel(s, SOURCE_TEXT[s], list.filter((c) => c.source === s), revenueByCouple))
      .filter((r) => r.leads > 0);
    const total = funnel("total", "Toplam", list, revenueByCouple);

    const metaList = list.filter((c) => c.source === "meta_form");
    const adKeys = new Map<string, AiCouple[]>();
    for (const c of metaList) {
      const { campaign, ad } = adOf(c);
      const k = ad ? `${campaign} › ${ad}` : campaign;
      adKeys.set(k, [...(adKeys.get(k) ?? []), c]);
    }
    const ads = [...adKeys.entries()].map(([k, l]) => funnel(k, k, l, revenueByCouple)).sort((a, b) => b.leads - a.leads);

    const resBySource = new Map<string, { count: number; revenue: number }>();
    for (const r of resRows) {
      const k = r.couple ? SOURCE_TEXT[r.couple.source] : "Doğrudan / diğer";
      const cur = resBySource.get(k) ?? { count: 0, revenue: 0 };
      resBySource.set(k, { count: cur.count + 1, revenue: cur.revenue + (r.res.total ?? 0) });
    }
    return { revenueByCouple, list, total, sources, ads, resRows, resBySource, totalRes: resList.length, totalRevenue: resList.reduce((s, r) => s + (r.total ?? 0), 0), advice: adviceFor(sources, ads) };
  }, [couples, reservations, p]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="rm-card h-16 animate-pulse" />
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="rm-card h-28 animate-pulse" />)}</div>
        <div className="rm-card h-72 animate-pulse" />
      </div>
    );
  }
  const t = data.total;

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Analitik"
        title="Satış Analizi"
        description="Çiftler nereden geliyor, kaçı dönüyor, hangisi rezervasyona çevriliyor — kaynak ve reklam bazında."
        icon={TrendingUp}
        actions={
          <div className="flex rounded-xl bg-slate-100 p-1" role="tablist" aria-label="Dönem">
            {(Object.keys(PERIOD) as Period[]).map((k) => (
              <button
                key={k}
                type="button"
                role="tab"
                aria-selected={p === k}
                onClick={() => setP(k)}
                className={cn("rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all", p === k ? "bg-white text-indigo-700 shadow-sm" : "text-slate-500 hover:text-slate-800")}
              >
                {PERIOD[k]}
              </button>
            ))}
          </div>
        }
      />

      {/* Üst özet */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { l: "Gelen talep", v: t.leads, s: "seçili dönemde" },
          { l: "Ulaşılan", v: t.touched, s: pct(t.touched, t.leads) + " · arama/mesaj" },
          { l: "Görüşülen / yazışan", v: Math.max(t.talked, t.replied), s: `${t.talked} telefonda · ${t.replied} yazdı` },
          { l: "Rezervasyon (AI çiftleri)", v: t.won, s: `dönüşüm %${t.conversion}` },
          { l: "Takvime giren rezervasyon", v: data.totalRes, s: formatPrice(data.totalRevenue) + " ciro" },
          { l: "İlk temas süresi", v: mins(t.medianFirstMin), s: "talepten ilk aramaya/mesaja (ortanca)" },
        ].map((k) => (
          <div key={k.l} className="rm-card rm-card-hover p-3.5 sm:p-4">
            <p className="text-xs font-medium text-slate-500">{k.l}</p>
            <p className="mt-1 font-editorial text-2xl leading-none text-slate-900 tabular-nums">{k.v}</p>
            <p className="mt-1.5 text-[11px] text-slate-500">{k.s}</p>
          </div>
        ))}
      </div>

      {/* Öneriler */}
      <AdminSection title="Öneriler" description="Verilere göre otomatik çıkarılan yorumlar" icon={Lightbulb}>
        <ul className="space-y-2">
          {data.advice.map((a, i) => (
            <li
              key={i}
              className={cn(
                "rounded-xl border px-3.5 py-2.5 text-sm",
                a.tone === "good" ? "border-emerald-200 bg-emerald-50 text-emerald-900" : a.tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-slate-200 bg-slate-50 text-slate-700"
              )}
            >
              {a.tone === "good" ? "✅ " : a.tone === "warn" ? "⚠️ " : "ℹ️ "}
              {a.text}
            </li>
          ))}
        </ul>
      </AdminSection>

      {/* Kaynak karşılaştırması */}
      <AdminSection title="Kaynak karşılaştırması" description="Düğün.com mu, Instagram/Facebook mu daha verimli?">
        <FunnelTable rows={[...data.sources, t]} />
      </AdminSection>

      {/* Sonuç dağılımı */}
      <AdminSection title="Çiftler şu an ne durumda?" description="Her çift tek bir gruba girer (son durumu)">
        <div className="space-y-4">
          {[...data.sources, t].map((r) => (
            <OutcomeBar key={r.key} row={r} />
          ))}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-slate-600">
            {GROUPS.map((g) => (
              <span key={g.key} className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />
                {g.label}
              </span>
            ))}
          </div>
          <details className="rounded-xl border border-slate-200 bg-white p-3 text-sm">
            <summary className="cursor-pointer font-semibold text-slate-700">Ayrıntılı dağılım</summary>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] font-semibold tracking-[0.06em] text-slate-500 uppercase">
                    <th className="py-2">Durum</th>
                    {[...data.sources, t].map((r) => <th key={r.key} className="px-2 text-right">{r.label}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {(Object.keys(OUTCOME_TEXT) as Outcome[]).map((o) => (
                    <tr key={o} className="border-t border-slate-100">
                      <td className="py-2 text-slate-700">{OUTCOME_TEXT[o]}</td>
                      {[...data.sources, t].map((r) => <td key={r.key} className="px-2 text-right tabular-nums">{r.outcomes[o]}</td>)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </AdminSection>

      {/* Reklam performansı */}
      <AdminSection title="Reklam performansı (Instagram / Facebook)" description="Form reklamlarından gelen çiftler — kampanya ve reklam bazında">
        {data.ads.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-sm text-slate-500">
            Seçili dönemde Instagram/Facebook formundan gelen çift yok. Reklamlar başladıkça burada kampanya kampanya dönüşüm görünecek.
          </p>
        ) : (
          <FunnelTable rows={data.ads} compact />
        )}
      </AdminSection>

      <AdSpendSection period={p} metaCouples={data.list.filter((c) => c.source === "meta_form")} wonRevenue={data.revenueByCouple} />

      <ProfitSection period={p} resRows={data.resRows} allCouples={couples ?? []} />

      {/* Rezervasyonlar nereden geldi */}
      <AdminSection title="Rezervasyonlar nereden geldi?" description="Takvimdeki rezervasyonlar telefondan AI çift kayıtlarıyla eşleştirilir">
        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
          {[...data.resBySource.entries()].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
              <p className="text-xs font-medium text-slate-500">{k}</p>
              <p className="mt-1 font-editorial text-2xl text-slate-900 tabular-nums">{v.count}</p>
              <p className="text-[11px] text-slate-500">{formatPrice(v.revenue)} ciro · {pct(v.count, data.totalRes)} pay</p>
            </div>
          ))}
          {data.resBySource.size === 0 && <p className="text-sm text-slate-500">Seçili dönemde rezervasyon yok.</p>}
        </div>
      </AdminSection>
    </div>
  );
}

function FunnelTable({ rows, compact }: { rows: FunnelRow[]; compact?: boolean }) {
  const cols: { k: string; l: string; v: (r: FunnelRow) => string | number; hint?: string }[] = [
    { k: "leads", l: "Talep", v: (r) => r.leads },
    { k: "touched", l: "Ulaşılan", v: (r) => r.touched },
    { k: "called", l: "Aranan", v: (r) => r.called },
    { k: "talked", l: "Telefonu açan", v: (r) => `${r.talked} (${pct(r.talked, r.called)})` },
    { k: "replied", l: "Cevap yazan", v: (r) => r.replied },
    ...(compact ? [] : [
      { k: "thought", l: "Düşüneyim diyen", v: (r: FunnelRow) => r.thought },
      { k: "cameBack", l: "Düşünüp geri dönen", v: (r: FunnelRow) => r.cameBack },
      { k: "noResponse", l: "Hiç dönmeyen", v: (r: FunnelRow) => r.noResponse },
      { k: "bookedElsewhere", l: "Başka firmayla anlaşan", v: (r: FunnelRow) => r.bookedElsewhere },
    ]),
    { k: "won", l: "Rezervasyon", v: (r) => r.won },
    { k: "conversion", l: "Dönüşüm", v: (r) => `%${r.conversion}` },
    { k: "revenue", l: "Ciro", v: (r) => (r.revenue ? formatPrice(r.revenue) : "—") },
    ...(compact ? [] : [{ k: "first", l: "İlk temas", v: (r: FunnelRow) => mins(r.medianFirstMin) }]),
  ];
  const best = Math.max(...rows.filter((r) => r.key !== "total").map((r) => r.conversion), 0);
  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-100">
      <table className="w-full min-w-[760px] text-sm">
        <thead className="bg-slate-50">
          <tr className="text-left text-[11px] font-semibold tracking-[0.04em] text-slate-500 uppercase">
            <th className="px-3 py-2.5">{compact ? "Kampanya / reklam" : "Kaynak"}</th>
            {cols.map((c) => <th key={c.k} className="px-2 py-2.5 text-right">{c.l}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.key} className={cn("border-t border-slate-100", r.key === "total" && "bg-slate-50/70 font-semibold")}>
              <td className="max-w-[220px] truncate px-3 py-2.5 text-slate-900" title={r.label}>
                {r.label}
                {r.key !== "total" && best > 0 && r.conversion === best && <span className="ml-1.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">en iyi</span>}
              </td>
              {cols.map((c) => <td key={c.k} className="px-2 py-2.5 text-right text-slate-700 tabular-nums">{c.v(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function OutcomeBar({ row }: { row: FunnelRow }) {
  const parts = GROUPS.map((g) => ({ ...g, n: g.items.reduce((s, o) => s + row.outcomes[o], 0) }));
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-slate-800">{row.label}</span>
        <span className="text-slate-500">{row.leads} çift</span>
      </div>
      <div className="mt-1.5 flex h-3 gap-[2px] overflow-hidden rounded-full bg-slate-100">
        {parts.filter((x) => x.n > 0).map((x) => (
          <div
            key={x.key}
            className="h-full first:rounded-l-full last:rounded-r-full transition-[width] duration-700"
            style={{ width: `${(x.n / Math.max(1, row.leads)) * 100}%`, background: x.color }}
            title={`${x.label}: ${x.n} (${pct(x.n, row.leads)})`}
          />
        ))}
      </div>
      <div className="mt-1 flex flex-wrap gap-x-3 text-[11px] text-slate-500">
        {parts.map((x) => (
          <span key={x.key}>{x.label.split(" (")[0]}: <b className="text-slate-800 tabular-nums">{x.n}</b></span>
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── Reklam harcaması (Meta) ───────────────────────── */

type SpendRow = { campaign: string; ad: string; spend: number; impressions: number; clicks: number; leads: number; messages: number };

function sinceOf(p: Period): string {
  const ms = p === "all" ? Date.now() - 365 * 86_400_000 : periodStart(p);
  return new Date(ms).toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
}

function AdSpendSection({ period, metaCouples, wonRevenue }: { period: Period; metaCouples: AiCouple[]; wonRevenue: Map<string, number> }) {
  const [rows, setRows] = useState<SpendRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const since = sinceOf(period);
  useEffect(() => {
    let alive = true;
    fetch(`/api/admin/meta-spend?since=${since}`)
      .then((r) => r.json())
      .then((j: { ok?: boolean; rows?: SpendRow[]; error?: string }) => {
        if (!alive) return;
        if (j.ok && j.rows) {
          setRows(j.rows);
          setErr(null);
        } else {
          setRows([]);
          setErr(j.error ?? "Harcama okunamadı");
        }
      })
      .catch(() => {
        if (!alive) return;
        setRows([]);
        setErr("Harcama okunamadı");
      });
    return () => {
      alive = false;
    };
  }, [since]);

  const camps = useMemo(() => {
    type Camp = { campaign: string; spend: number; impressions: number; clicks: number; leads: number; messages: number; panel: number; won: number; revenue: number };
    const m = new Map<string, Camp>();
    for (const r of rows ?? []) {
      const x = m.get(r.campaign) ?? { campaign: r.campaign, spend: 0, impressions: 0, clicks: 0, leads: 0, messages: 0, panel: 0, won: 0, revenue: 0 };
      x.spend += r.spend;
      x.impressions += r.impressions;
      x.clicks += r.clicks;
      x.leads += r.leads;
      x.messages += r.messages;
      m.set(r.campaign, x);
    }
    for (const c of metaCouples) {
      const x = m.get(adOf(c).campaign);
      if (!x) continue;
      x.panel++;
      if (c.status === "won") x.won++;
      x.revenue += wonRevenue.get(c.id) ?? 0;
    }
    return [...m.values()].filter((x) => x.spend > 0).sort((a, b) => b.spend - a.spend);
  }, [rows, metaCouples, wonRevenue]);

  const tot = camps.reduce(
    (a, x) => ({ spend: a.spend + x.spend, leads: a.leads + x.leads, messages: a.messages + x.messages, won: a.won + x.won, revenue: a.revenue + x.revenue }),
    { spend: 0, leads: 0, messages: 0, won: 0, revenue: 0 }
  );
  const tl = (n: number) => formatPrice(Math.round(n));
  const per = (a: number, b: number) => (b ? tl(a / b) : "—");

  return (
    <AdminSection title="Reklam harcaması ve getirisi" description={`Meta reklam hesabı · ${since} – bugün · rezervasyon başına maliyet ve ciro/harcama`}>
      {rows === null ? (
        <div className="h-24 animate-pulse rounded-2xl bg-slate-100" />
      ) : err ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">⚠️ {err}</p>
      ) : camps.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 px-3 py-5 text-center text-sm text-slate-500">Bu dönemde harcama yapılan kampanya yok.</p>
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
            {[
              { l: "Toplam harcama", v: tl(tot.spend) },
              { l: "Form başvurusu / DM başlatan", v: `${tot.leads} / ${tot.messages}` },
              { l: "Başvuru veya mesaj başına", v: per(tot.spend, tot.leads + tot.messages) },
              { l: "Ciro / harcama", v: tot.spend ? `${(tot.revenue / tot.spend).toFixed(1)}x` : "—" },
            ].map((k) => (
              <div key={k.l} className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3.5">
                <p className="text-xs font-medium text-slate-500">{k.l}</p>
                <p className="mt-1 font-editorial text-xl text-slate-900 tabular-nums">{k.v}</p>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="bg-slate-50">
                <tr className="text-left text-[11px] font-semibold tracking-[0.04em] text-slate-500 uppercase">
                  <th className="px-3 py-2.5">Kampanya</th>
                  <th className="px-2 text-right">Harcama</th>
                  <th className="px-2 text-right">Gösterim</th>
                  <th className="px-2 text-right">Tıklama</th>
                  <th className="px-2 text-right">Form başvurusu</th>
                  <th className="px-2 text-right">DM başlatan</th>
                  <th className="px-2 text-right">Başına maliyet</th>
                  <th className="px-2 text-right">Panele düşen</th>
                  <th className="px-2 text-right">Rezervasyon</th>
                  <th className="px-2 text-right">Rez. başına</th>
                  <th className="px-2 text-right">Ciro/harcama</th>
                </tr>
              </thead>
              <tbody>
                {camps.map((x) => (
                  <tr key={x.campaign} className="border-t border-slate-100">
                    <td className="max-w-[260px] truncate px-3 py-2.5 text-slate-900" title={x.campaign}>{x.campaign}</td>
                    <td className="px-2 text-right tabular-nums">{tl(x.spend)}</td>
                    <td className="px-2 text-right tabular-nums">{x.impressions.toLocaleString("tr-TR")}</td>
                    <td className="px-2 text-right tabular-nums">{x.clicks.toLocaleString("tr-TR")}</td>
                    <td className="px-2 text-right tabular-nums">{x.leads}</td>
                    <td className="px-2 text-right tabular-nums">{x.messages}</td>
                    <td className="px-2 text-right tabular-nums">{per(x.spend, x.leads + x.messages)}</td>
                    <td className="px-2 text-right tabular-nums">{x.panel}</td>
                    <td className="px-2 text-right tabular-nums">{x.won}</td>
                    <td className={cn("px-2 text-right tabular-nums", x.won === 0 && x.spend > 1000 && "text-rose-700")}>{x.won ? tl(x.spend / x.won) : "—"}</td>
                    <td className="px-2 text-right tabular-nums">{x.spend ? `${(x.revenue / x.spend).toFixed(1)}x` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-1.5 text-sm">
            {camps
              .filter((x) => x.spend > 1000 && x.won === 0)
              .map((x) => (
                <li key={x.campaign} className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-amber-900">
                  ⚠️ &quot;{x.campaign}&quot;: {tl(x.spend)} harcandı, panelde henüz rezervasyona dönen yok
                  {x.leads + x.messages ? ` (${x.leads + x.messages} başvuru/mesaj, tanesi ${per(x.spend, x.leads + x.messages)})` : ""}. Kreatifi değiştirin ya da bütçeyi daha iyi
                  giden kampanyaya kaydırın.
                </li>
              ))}
          </ul>
          <p className="text-[11px] text-slate-500">
            &quot;DM başlatan&quot; kampanyalarda çiftler Instagram mesajından yazar; panele ancak numaraları eklenirse düşer. Form reklamlarında başvurular panele otomatik
            düşer ve rezervasyona kadar izlenir — en net ölçüm form reklamlarıyla olur.
          </p>
        </div>
      )}
    </AdminSection>
  );
}

/* ───────────────────────── Kazanç ve kâr ───────────────────────── */

type ResRow = { res: { id: string; total?: number; depositAmount?: number; remainingAmount?: number; approvedAt?: string; createdAt?: string; customer?: { firstName?: string; lastName?: string } }; couple?: AiCouple };

/**
 * Ciro / kapora / bekleyen ödeme / reklam harcaması / reklam sonrası kalan
 * + her rezervasyonun reklam maliyeti = kampanyanın BAŞINDAN BERİ harcaması ÷ o kampanyadan gelen toplam rezervasyon
 */
function ProfitSection({ period, resRows, allCouples }: { period: Period; resRows: ResRow[]; allCouples: AiCouple[] }) {
  const [periodSpend, setPeriodSpend] = useState<number | null>(null);
  const [lifetime, setLifetime] = useState<Map<string, number> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const since = sinceOf(period);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetch(`/api/admin/meta-spend?since=${since}`).then((r) => r.json()),
      fetch(`/api/admin/meta-spend?lifetime=1`).then((r) => r.json()),
    ])
      .then(([p, l]: { ok?: boolean; rows?: { campaign: string; spend: number }[]; error?: string }[]) => {
        if (!alive) return;
        if (!p.ok || !l.ok) setErr(p.error ?? l.error ?? "Reklam harcaması okunamadı");
        setPeriodSpend((p.rows ?? []).reduce((s, r) => s + r.spend, 0));
        const m = new Map<string, number>();
        for (const r of l.rows ?? []) m.set(r.campaign, (m.get(r.campaign) ?? 0) + r.spend);
        setLifetime(m);
      })
      .catch(() => alive && setErr("Reklam harcaması okunamadı"));
    return () => {
      alive = false;
    };
  }, [since]);

  // Kampanya başına TÜM zamanlardaki rezervasyon sayısı (maliyeti bölmek için)
  const wonByCampaign = useMemo(() => {
    const m = new Map<string, number>();
    for (const c of allCouples) if (c.source === "meta_form" && c.status === "won") m.set(adOf(c).campaign, (m.get(adOf(c).campaign) ?? 0) + 1);
    return m;
  }, [allCouples]);

  const ciro = resRows.reduce((s, r) => s + (r.res.total ?? 0), 0);
  const kapora = resRows.reduce((s, r) => s + (r.res.depositAmount ?? 0), 0);
  const kalanOdeme = resRows.reduce((s, r) => s + (r.res.remainingAmount ?? 0), 0);
  const spend = periodSpend ?? 0;
  const net = ciro - spend;
  const tl = (n: number) => formatPrice(Math.round(n));

  const perRes = resRows.map((r) => {
    const c = r.couple;
    const camp = c?.source === "meta_form" ? adOf(c).campaign : null;
    const life = camp && lifetime ? lifetime.get(camp) : undefined;
    const n = camp ? wonByCampaign.get(camp) ?? 0 : 0;
    const cost = camp && life !== undefined && n > 0 ? life / n : null;
    const name = c?.name ?? [r.res.customer?.firstName, r.res.customer?.lastName].filter(Boolean).join(" ") ?? "—";
    const kaynak = c ? (c.source === "meta_form" ? `Instagram/Facebook · ${camp}` : SOURCE_TEXT[c.source]) : "Doğrudan / diğer";
    return { id: r.res.id, name, kaynak, tutar: r.res.total ?? 0, cost, kalan: (r.res.total ?? 0) - (cost ?? 0) };
  });

  return (
    <AdminSection title="Kazanç ve kâr" description="Seçili dönemde alınan işler, tahsilat ve reklam harcaması — personel/ekipman gibi diğer giderler dahil değildir">
      {err && <p className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">⚠️ {err}</p>}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-3 xl:grid-cols-6">
        {[
          { l: "Alınan işler (ciro)", v: tl(ciro), s: `${resRows.length} rezervasyon` },
          { l: "Alınan kapora", v: tl(kapora), s: "tahsil edilen" },
          { l: "Bekleyen ödeme", v: tl(kalanOdeme), s: "çekim sonrası alınacak" },
          { l: "Reklam harcaması", v: periodSpend === null ? "…" : tl(spend), s: "Meta, seçili dönem" },
          { l: "Reklam sonrası kalan", v: periodSpend === null ? "…" : tl(net), s: ciro ? `kâr oranı %${Math.round((net / ciro) * 100)}` : "—", strong: true },
          { l: "Ciro / reklam", v: spend ? `${(ciro / spend).toFixed(1)}x` : "—", s: spend ? `1 TL reklam → ${(ciro / spend).toFixed(1)} TL iş` : "harcama yok" },
        ].map((k) => (
          <div key={k.l} className={cn("rounded-2xl border p-3.5", k.strong ? (net >= 0 ? "border-emerald-200 bg-emerald-50" : "border-rose-200 bg-rose-50") : "border-slate-100 bg-slate-50/70")}>
            <p className="text-xs font-medium text-slate-500">{k.l}</p>
            <p className="mt-1 font-editorial text-xl text-slate-900 tabular-nums">{k.v}</p>
            <p className="mt-1 text-[11px] text-slate-500">{k.s}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-100">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-slate-50">
            <tr className="text-left text-[11px] font-semibold tracking-[0.04em] text-slate-500 uppercase">
              <th className="px-3 py-2.5">Çift</th>
              <th className="px-2">Nereden geldi</th>
              <th className="px-2 text-right">İş tutarı</th>
              <th className="px-2 text-right">Reklam maliyeti</th>
              <th className="px-2 text-right">Reklam sonrası</th>
            </tr>
          </thead>
          <tbody>
            {perRes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-3 py-5 text-center text-slate-500">Seçili dönemde rezervasyon yok.</td>
              </tr>
            ) : (
              perRes.map((x) => (
                <tr key={x.id} className="border-t border-slate-100">
                  <td className="px-3 py-2.5 font-medium text-slate-900">{x.name}</td>
                  <td className="max-w-[260px] truncate px-2 text-slate-600" title={x.kaynak}>{x.kaynak}</td>
                  <td className="px-2 text-right tabular-nums">{tl(x.tutar)}</td>
                  <td className="px-2 text-right tabular-nums">{x.cost === null ? <span className="text-slate-400">reklamsız</span> : tl(x.cost)}</td>
                  <td className="px-2 text-right font-semibold tabular-nums text-slate-900">{tl(x.kalan)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-slate-500">
        Reklam maliyeti: çiftin geldiği kampanyanın başından beri toplam harcaması ÷ o kampanyadan gelen rezervasyon sayısı. Düğün.com ve doğrudan gelen işler &quot;reklamsız&quot; sayılır.
      </p>
    </AdminSection>
  );
}
