"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { cn, formatPrice } from "@/lib/utils";

type SessionRow = {
  session_id: string;
  firstTs: string | null;
  lastTs: string | null;
  maxStep: number;
  whatsapp: boolean;
  total: number;
  name: string;
  phone: string;
  utm_source: string | null;
  utm_campaign: string | null;
  device: string | null;
  eventCount: number;
};
type Abandoner = {
  sessionId: string;
  name: string;
  phone: string;
  weddingDate: string;
  lineSummary: string[];
  total: number;
  updatedAt: string;
  called: boolean;
  lastStep: number;
};
type Summary = Record<string, number | string>;
type VisitDaily = { day: string; total: number; utm: number };
type Step3Funnel = Record<string, number>;
type JourneyData = {
  summary: Summary;
  sessions: SessionRow[];
  abandoners: Abandoner[];
  visitsDaily: VisitDaily[];
  step3Funnel: Step3Funnel;
  campaigns: string[];
};

const STEP_LABELS = ["", "Paket", "Özelleştir", "Tarih", "WhatsApp"];
const TABS = ["Özet", "Funnel", "Oturumlar", "Yarım Kalanlar"] as const;

function Card({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone?: "gold" | "green";
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <p className="text-[11px] tracking-wide text-rm-gray-500 uppercase">{label}</p>
      <p
        className={cn(
          "mt-1 font-editorial text-2xl",
          tone === "green" ? "text-emerald-400" : tone === "gold" ? "text-rm-champagne" : "text-rm-off-white"
        )}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-[10px] leading-snug text-rm-gray-500">{hint}</p>}
    </div>
  );
}

/** Son 14 günün anonim trafiği — toplam çubuk, reklamlı kısım altın */
function VisitsSpark({ rows }: { rows: VisitDaily[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total));
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.03] p-4">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <p className="text-[11px] tracking-wide text-rm-gray-500 uppercase">
          Son 14 gün — sayfa açılışı
        </p>
        <p className="text-[10px] text-rm-gray-500">
          <span className="text-rm-champagne">■</span> reklamlı (UTM)
        </p>
      </div>
      <div className="flex h-24 items-end gap-1">
        {rows.map((r) => (
          <div
            key={r.day}
            className="flex flex-1 flex-col justify-end"
            title={`${r.day} — ${r.total} açılış (${r.utm} reklamlı)`}
          >
            <div
              className="w-full rounded-t-sm bg-white/15"
              style={{ height: `${Math.round(((r.total - r.utm) / max) * 100)}%` }}
            />
            <div
              className="w-full bg-rm-champagne"
              style={{ height: `${Math.round((r.utm / max) * 100)}%` }}
            />
          </div>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[10px] text-rm-gray-500">
        <span>{rows[0]?.day.slice(5)}</span>
        <span>{rows[rows.length - 1]?.day.slice(5)}</span>
      </div>
    </div>
  );
}

export function AdminJourneyPanel() {
  const [data, setData] = useState<JourneyData | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Özet");

  const reload = () => {
    fetch("/api/admin/journey", { cache: "no-store" })
      .then((r) => r.json())
      .then((d: JourneyData) => setData(d))
      .catch(() => {});
  };
  useEffect(() => {
    reload();
  }, []);

  if (!data) return <p className="text-rm-gray-500">Yükleniyor…</p>;

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
              tab === t
                ? "bg-rm-champagne text-rm-black"
                : "border border-white/10 text-rm-gray-400 hover:text-rm-off-white"
            )}
          >
            {t}
            {t === "Yarım Kalanlar" && data.abandoners.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500/25 px-1.5 text-[10px] font-bold text-red-300">
                {data.abandoners.filter((a) => !a.called).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {tab === "Özet" && <Ozet s={data.summary} visitsDaily={data.visitsDaily ?? []} />}
      {tab === "Funnel" && (
        <Funnel
          sessions={data.sessions}
          campaigns={data.campaigns}
          step3={data.step3Funnel ?? {}}
        />
      )}
      {tab === "Oturumlar" && <Sessions rows={data.sessions} />}
      {tab === "Yarım Kalanlar" && <Abandoners rows={data.abandoners} onChange={reload} />}
    </div>
  );
}

function Ozet({ s, visitsDaily }: { s: Summary; visitsDaily: VisitDaily[] }) {
  const today = Number(s.visitorsToday) || 0;
  const utmToday = Number(s.utmToday) || 0;
  const utmPct = today ? Math.round((utmToday / today) * 100) : 0;
  const consented = Number(s.consentedToday) || 0;

  return (
    <div className="space-y-4">
      {/* GERÇEK TRAFİK — çerez onayından bağımsız anonim sayaç */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          label="Bugün ziyaret"
          value={String(today)}
          hint="Sayfa açılışı — çerez onayı gerekmez"
        />
        <Card
          label="Bugün reklamlı (UTM)"
          value={String(utmToday)}
          tone="gold"
          hint={today ? `Trafiğin %${utmPct}'i reklamdan` : "Henüz veri yok"}
        />
        <Card label="7 gün ziyaret" value={String(s.visitorsWeek)} />
        <Card
          label="7 gün reklamlı"
          value={String(s.utmWeek)}
          tone="gold"
          hint={s.topVisitCampaign !== "—" ? `En çok: ${s.topVisitCampaign}` : undefined}
        />
      </div>

      <VisitsSpark rows={visitsDaily} />

      {/* Rızaya bağlı ölçümler — kaç kişiyi detaylı izleyebildiğimiz */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card
          label="Onaylı oturum (bugün)"
          value={String(consented)}
          hint={
            today
              ? `Ziyaretin %${Math.round((consented / today) * 100)}'i çerez onayı verdi`
              : "Journey detayı yalnızca bunlarda var"
          }
        />
        <Card label="Kurulan paket" value={String(s.packagesBuilt)} />
        <Card label="WhatsApp tık" value={String(s.whatsappClicks)} tone="green" />
        <Card
          label="Dönüşüm oranı"
          value={`%${s.conversionRate}`}
          tone="gold"
          hint="Onaylı oturumlar üzerinden"
        />
        <Card label="Ort. sepet" value={formatPrice(Number(s.avgCart))} />
        <Card label="Upsell kabul" value={`%${s.upsellAcceptRate}`} />
        <Card label="Son fırsat kurtarma" value={`%${s.lastchanceRecoveryRate}`} />
        <Card label="En çok paket" value={`Paket ${s.topPackage}`} tone="gold" />
        <Card label="En çok plato" value={String(s.topPlato)} />
        <Card label="En çok ekstra" value={String(s.topAddon)} />
      </div>
    </div>
  );
}

/** §6 — Adım 3 alan bazlı mikro funnel: nerede düşüyorlar */
function Step3Breakdown({ f }: { f: Step3Funnel }) {
  const rows: { key: string; label: string }[] = [
    { key: "step3_view", label: "Adım 3 görüldü" },
    { key: "form_start", label: "Forma başladı" },
    { key: "date_filled", label: "Tarih girdi" },
    { key: "name_filled", label: "Ad Soyad girdi" },
    { key: "cta_click", label: "Butona bastı" },
    { key: "whatsapp", label: "WhatsApp'a geçti" },
  ];
  const base = f.step3_view || 1;
  return (
    <div className="mt-8 rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <h4 className="text-sm font-semibold text-rm-off-white">
        Adım 3 kırılımı — nerede düşüyorlar
      </h4>
      <p className="mt-1 text-[11px] text-rm-gray-500">
        Formu görenlerin kaçı hangi alana kadar geldi. En büyük düşüş = darboğaz.
      </p>
      <div className="mt-4 space-y-2.5">
        {rows.map((r, i) => {
          const count = f[r.key] ?? 0;
          const pct = Math.round((count / base) * 100);
          const prev = i > 0 ? f[rows[i - 1].key] ?? 0 : count;
          const drop = i > 0 && prev ? Math.round((1 - count / prev) * 100) : 0;
          return (
            <div key={r.key}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-rm-gray-200">{r.label}</span>
                <span className="tabular-nums text-rm-off-white">
                  {count}
                  {i > 0 && drop > 0 && (
                    <span className="ml-1.5 text-red-400">(−%{drop})</span>
                  )}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/5">
                <div
                  className={cn(
                    "h-full rounded-full",
                    r.key === "whatsapp" ? "bg-emerald-500" : "bg-rm-champagne"
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Alternatif yollar */}
      <div className="mt-4 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3 text-center">
        <div>
          <p className="font-editorial text-lg text-emerald-400">{f.shortcut_sent ?? 0}</p>
          <p className="text-[10px] text-rm-gray-500">WhatsApp kısayolu (formu atladı)</p>
        </div>
        <div>
          <p className="font-editorial text-lg text-rm-champagne">{f.exit_shown ?? 0}</p>
          <p className="text-[10px] text-rm-gray-500">Çıkışta yakalandı</p>
        </div>
        <div>
          <p className="font-editorial text-lg text-emerald-400">
            {(f.exit_whatsapp ?? 0) + (f.exit_copy ?? 0)}
          </p>
          <p className="text-[10px] text-rm-gray-500">Çıkışta kurtarıldı</p>
        </div>
      </div>
    </div>
  );
}

function Funnel({
  sessions,
  campaigns,
  step3,
}: {
  sessions: SessionRow[];
  campaigns: string[];
  step3: Step3Funnel;
}) {
  const [range, setRange] = useState<"7" | "30" | "all">("30");
  const [campaign, setCampaign] = useState("all");
  const [nowMs] = useState(() => Date.now()); // render'da impure çağrı yok

  const filtered = useMemo(() => {
    const from = range === "all" ? 0 : nowMs - Number(range) * 864e5;
    return sessions.filter((s) => {
      const okDate = !s.firstTs || new Date(s.firstTs).getTime() >= from;
      const okCamp = campaign === "all" || s.utm_campaign === campaign;
      return okDate && okCamp;
    });
  }, [sessions, range, campaign, nowMs]);

  const steps = [1, 2, 3, 4].map((step) => ({
    step,
    label: STEP_LABELS[step],
    count:
      step === 4
        ? filtered.filter((s) => s.whatsapp || s.maxStep >= 4).length
        : filtered.filter((s) => s.maxStep >= step).length,
  }));
  const base = steps[0].count || 1;

  return (
    <div>
      <div className="mb-4 flex flex-wrap gap-2">
        <select
          value={range}
          onChange={(e) => setRange(e.target.value as "7" | "30" | "all")}
          className="rounded-md border border-white/10 bg-rm-black-elevated px-3 py-1.5 text-xs text-rm-off-white"
        >
          <option value="7">Son 7 gün</option>
          <option value="30">Son 30 gün</option>
          <option value="all">Tümü</option>
        </select>
        <select
          value={campaign}
          onChange={(e) => setCampaign(e.target.value)}
          className="rounded-md border border-white/10 bg-rm-black-elevated px-3 py-1.5 text-xs text-rm-off-white"
        >
          <option value="all">Tüm kampanyalar</option>
          {campaigns.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2.5">
        {steps.map((st, i) => {
          const pct = Math.round((st.count / base) * 100);
          const drop =
            i > 0 && steps[i - 1].count
              ? Math.round((1 - st.count / steps[i - 1].count) * 100)
              : 0;
          return (
            <div key={st.step}>
              <div className="mb-1 flex items-baseline justify-between text-sm">
                <span className="text-rm-gray-200">
                  {st.step}. {st.label}
                </span>
                <span className="tabular-nums text-rm-off-white">
                  {st.count}{" "}
                  {i > 0 && (
                    <span className="text-red-400">(−%{drop} düşüş)</span>
                  )}
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/5">
                <div
                  className="h-full rounded-full bg-rm-champagne"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Step3Breakdown f={step3} />
    </div>
  );
}

function Sessions({ rows }: { rows: SessionRow[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [events, setEvents] = useState<{ event_type: string; ts: string; payload: Record<string, unknown> }[]>([]);

  const openSession = (id: string) => {
    setOpen(id);
    setEvents([]);
    fetch(`/api/admin/journey?session=${encodeURIComponent(id)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => setEvents(d.events ?? []))
      .catch(() => {});
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left text-[11px] tracking-wide text-rm-gray-500 uppercase">
            <th className="py-2 pr-3">Kişi / Oturum</th>
            <th className="py-2 pr-3">Son adım</th>
            <th className="py-2 pr-3">Tutar</th>
            <th className="py-2 pr-3">Kampanya</th>
            <th className="py-2 pr-3">Cihaz</th>
            <th className="py-2">Zaman</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 200).map((s) => (
            <Fragment key={s.session_id}>
              <tr
                onClick={() => openSession(s.session_id)}
                className="cursor-pointer border-b border-white/5 hover:bg-white/[0.03]"
              >
                <td className="py-2 pr-3">
                  {s.name || s.phone ? (
                    <span className="block">
                      <span className="block text-rm-off-white">{s.name || "—"}</span>
                      {s.phone && (
                        <a
                          href={`tel:${s.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="block text-[11px] text-rm-champagne hover:underline"
                        >
                          {s.phone}
                        </a>
                      )}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-rm-gray-500">
                      anonim · {s.session_id.slice(-8)}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-3">
                  <span
                    className={cn(
                      "rounded px-1.5 py-0.5 text-[11px] font-semibold",
                      s.whatsapp ? "bg-emerald-500/15 text-emerald-400" : "bg-white/5 text-rm-gray-300"
                    )}
                  >
                    {STEP_LABELS[Math.min(s.maxStep, 4)]}
                  </span>
                </td>
                <td className="py-2 pr-3 tabular-nums text-rm-off-white">
                  {s.total ? formatPrice(s.total) : "—"}
                </td>
                <td className="py-2 pr-3 text-rm-gray-400">{s.utm_campaign ?? "—"}</td>
                <td className="py-2 pr-3 text-rm-gray-400">{s.device ?? "—"}</td>
                <td className="py-2 text-[11px] text-rm-gray-500">
                  {s.lastTs ? new Date(s.lastTs).toLocaleString("tr-TR") : "—"}
                </td>
              </tr>
              {open === s.session_id && (
                <tr>
                  <td colSpan={6} className="bg-rm-black-elevated/40 px-3 py-3">
                    <ol className="space-y-1.5">
                      {events.map((e, i) => (
                        <li key={i} className="flex items-baseline gap-3 text-xs">
                          <span className="w-16 shrink-0 text-rm-gray-600">
                            {new Date(e.ts).toLocaleTimeString("tr-TR")}
                          </span>
                          <span className="font-medium text-rm-champagne">{e.event_type}</span>
                          <span className="text-rm-gray-500">
                            {Object.entries(e.payload)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(" · ")}
                          </span>
                        </li>
                      ))}
                      {!events.length && (
                        <li className="text-xs text-rm-gray-600">Yükleniyor…</li>
                      )}
                    </ol>
                  </td>
                </tr>
              )}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Abandoners({ rows, onChange }: { rows: Abandoner[]; onChange: () => void }) {
  const toggleCalled = async (sessionId: string, called: boolean) => {
    await fetch("/api/admin/draft-called", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, called }),
    });
    onChange();
  };

  if (!rows.length)
    return <p className="text-sm text-rm-gray-500">Aranacak yarım kalan yok. 🎉</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-sm">
        <thead>
          <tr className="border-b border-white/8 text-left text-[11px] tracking-wide text-rm-gray-500 uppercase">
            <th className="py-2 pr-3">Ad</th>
            <th className="py-2 pr-3">Telefon</th>
            <th className="py-2 pr-3">Tutar</th>
            <th className="py-2 pr-3">Çıkış adımı</th>
            <th className="py-2 pr-3">Zaman</th>
            <th className="py-2">Arandı</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr
              key={a.sessionId}
              className={cn("border-b border-white/5", a.called && "opacity-50")}
            >
              <td className="py-2 pr-3 text-rm-off-white">{a.name || "—"}</td>
              <td className="py-2 pr-3">
                <a href={`tel:${a.phone}`} className="text-rm-champagne hover:underline">
                  {a.phone}
                </a>
              </td>
              <td className="py-2 pr-3 tabular-nums text-rm-off-white">
                {a.total ? formatPrice(a.total) : "—"}
              </td>
              <td className="py-2 pr-3 text-rm-gray-400">
                {STEP_LABELS[Math.min(a.lastStep, 4)]}
              </td>
              <td className="py-2 pr-3 text-[11px] text-rm-gray-500">
                {new Date(a.updatedAt).toLocaleString("tr-TR")}
              </td>
              <td className="py-2">
                <input
                  type="checkbox"
                  checked={a.called}
                  onChange={(e) => toggleCalled(a.sessionId, e.target.checked)}
                  className="h-4 w-4 accent-rm-champagne"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
