"use client";

/* Admin fetch bootstrap — setState in effect is intentional for range/session loads */
/* eslint-disable react-hooks/set-state-in-effect */

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  AdminEmptyState,
  AdminPanelHeader,
} from "@/components/admin/admin-panel-header";
import {
  AdminSessionsView,
  type SessionDetailPayload,
  type SessionListRow,
} from "@/components/admin/admin-sessions-view";
import { Filter, RefreshCw, AlertTriangle } from "lucide-react";

type Range = "today" | "yesterday" | "last_7" | "last_14" | "last_30";

type Dashboard = {
  range: { label: string };
  health: {
    startRate: number;
    checkoutRate: number;
    reserveRate: number;
    biggestLoss: { from: string; to: string; rate: number } | null;
    alerts: string[];
  };
  stages: {
    key: string;
    label: string;
    count: number;
    rateFromPrev: number | null;
    dropOff: number | null;
  }[];
  biggest_drop: { from: string; to: string; rate: number } | null;
  drop_off: {
    key: string;
    label: string;
    count: number;
    rate: number;
    avgDwellSec: number;
    devices: Record<string, number>;
    sources: Record<string, number>;
    campaigns: Record<string, number>;
    lastAction: string;
    scroll?: {
      packages: number;
      plato: number;
      continueBtn: number;
    };
  }[];
  campaigns: {
    campaign: string;
    source: string;
    page: number;
    start: number;
    checkout: number;
    reserve: number;
    reserveRate: number;
  }[];
  devices: { device: string; page: number; reserve: number; rate: number }[];
  os: { os: string; page: number; reserve: number; rate: number }[];
  durations: {
    page_to_select_sec: number;
    select_to_plato_sec: number;
    plato_to_continue_sec: number;
    checkout_to_submit_sec: number;
  };
  activity: {
    time: string;
    event: string;
    session_id: string;
    lead_id: string | null;
  }[];
  traffic: { name: string; count: number }[];
  sessions: SessionListRow[];
  ad_buckets?: Record<string, number>;
  form_errors: { label: string; count: number }[];
};

type SessionDetail = SessionDetailPayload;

type ErrorsPayload = {
  form_errors: { label: string; count: number }[];
  tech_errors: {
    id: string;
    error_type: string;
    message: string;
    count: number;
    funnel_step: string | null;
    device: string | null;
    browser: string | null;
    first_seen_at: string;
    last_seen_at: string;
  }[];
};

function pct(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "—";
  return `%${(n * 100).toFixed(1)}`;
}

function fmtSec(s: number) {
  if (!s) return "—";
  if (s < 60) return `${s} sn`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m} dk ${r} sn`;
}

const RANGES: { id: Range; label: string }[] = [
  { id: "today", label: "Bugün" },
  { id: "yesterday", label: "Dün" },
  { id: "last_7", label: "7 gün" },
  { id: "last_14", label: "14 gün" },
  { id: "last_30", label: "30 gün" },
];

type SubTab =
  | "funnel"
  | "dropoff"
  | "sessions"
  | "ads"
  | "forms"
  | "tech";

export function AdminFunnelPanel({
  initialTab = "funnel",
}: {
  initialTab?: SubTab;
}) {
  const [range, setRange] = useState<Range>("last_7");
  const [sub, setSub] = useState<SubTab>(initialTab);
  const [data, setData] = useState<Dashboard | null>(null);
  const [errors, setErrors] = useState<ErrorsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, err] = await Promise.all([
        fetch(`/api/admin/analytics?range=${range}`, {
          credentials: "include",
        }).then((r) => r.json()),
        fetch(`/api/admin/analytics?view=errors&range=${range}`, {
          credentials: "include",
        }).then((r) => r.json()),
      ]);
      setData(dash);
      setErrors(err);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    fetch(
      `/api/admin/analytics?view=session&session=${encodeURIComponent(sessionId)}&range=${range}`,
      { credentials: "include" }
    )
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId, range]);

  const stages = data?.stages ?? [];
  const worstDropKey = data?.biggest_drop
    ? stages.find(
        (s) =>
          s.dropOff != null &&
          Math.abs((s.dropOff ?? 0) - (data.biggest_drop?.rate ?? -1)) < 0.001
      )?.key
    : null;

  return (
    <div className="space-y-5">
      <AdminPanelHeader
        eyebrow="Analitik"
        title="Funnel Analizi"
        description="Tüm sayfalar → rezervasyon. Meta’dan bağımsız iç analytics."
        icon={Filter}
        meta={data ? data.range.label : undefined}
        actions={
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs text-rm-gray-300 hover:border-rm-champagne/40"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Yenile
          </button>
        }
      />

      <div className="flex flex-wrap gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              range === r.id
                ? "bg-rm-champagne/20 text-rm-champagne"
                : "bg-white/5 text-rm-gray-400 hover:bg-white/10"
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {data?.health.alerts?.length ? (
        <div className="space-y-2">
          {data.health.alerts.map((a) => (
            <p
              key={a}
              className="flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              {a}
            </p>
          ))}
        </div>
      ) : null}

      {data ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Paket başlangıç"
            value={pct(data.health.startRate)}
          />
          <Stat
            label="Checkout oranı"
            value={pct(data.health.checkoutRate)}
          />
          <Stat
            label="Rezervasyon oranı"
            value={pct(data.health.reserveRate)}
          />
          <Stat
            label="En büyük kayıp"
            value={
              data.health.biggestLoss
                ? `${data.health.biggestLoss.from} → ${data.health.biggestLoss.to}`
                : "—"
            }
            small
          />
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 border-b border-white/10 pb-2">
        {(
          [
            ["funnel", "Funnel"],
            ["dropoff", "Drop-off"],
            ["sessions", "Sessionlar"],
            ["ads", "Reklam"],
            ["forms", "Form hataları"],
            ["tech", "Teknik hatalar"],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setSub(id)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
              sub === id
                ? "bg-white/10 text-rm-off-white"
                : "text-rm-gray-500 hover:text-rm-gray-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-rm-gray-500">Yükleniyor…</p>
      ) : !data ? (
        <AdminEmptyState
          title="Veri yok"
          description="Henüz analytics event kaydı oluşmamış. Ana sayfa, galeri ve paket trafiği bekleniyor."
        />
      ) : (
        <>
          {sub === "funnel" && (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="bg-white/[0.03] text-xs text-rm-gray-500">
                    <tr>
                      <th className="p-3">Adım</th>
                      <th className="p-3">Session</th>
                      <th className="p-3">Öncekine göre</th>
                      <th className="p-3">Drop-off</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stages.map((s) => (
                      <tr
                        key={s.key}
                        className={`border-t border-white/5 ${
                          s.key === worstDropKey ? "bg-red-500/10" : ""
                        }`}
                      >
                        <td className="p-3 font-medium text-rm-off-white">
                          {s.label}
                          {s.key === worstDropKey ? (
                            <span className="ml-2 text-[10px] font-bold tracking-wider text-red-300 uppercase">
                              en büyük kayıp
                            </span>
                          ) : null}
                        </td>
                        <td className="p-3 tabular-nums">{s.count}</td>
                        <td className="p-3 tabular-nums">
                          {pct(s.rateFromPrev)}
                        </td>
                        <td className="p-3 tabular-nums text-rm-gray-400">
                          {pct(s.dropOff)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Card title="Ortalama süreler">
                  <ul className="space-y-1 text-sm text-rm-gray-300">
                    <li>
                      Sayfa → ilk seçim:{" "}
                      {fmtSec(data.durations.page_to_select_sec)}
                    </li>
                    <li>
                      Paket → plato:{" "}
                      {fmtSec(data.durations.select_to_plato_sec)}
                    </li>
                    <li>
                      Plato → devam:{" "}
                      {fmtSec(data.durations.plato_to_continue_sec)}
                    </li>
                    <li>
                      Checkout → rezervasyon:{" "}
                      {fmtSec(data.durations.checkout_to_submit_sec)}
                    </li>
                  </ul>
                </Card>
                <Card title="Son aktiviteler">
                  <ul className="max-h-56 space-y-1.5 overflow-y-auto text-xs text-rm-gray-400">
                    {data.activity.map((a, i) => (
                      <li key={`${a.time}-${i}`}>
                        <span className="tabular-nums text-rm-gray-500">
                          {new Date(a.time).toLocaleTimeString("tr-TR")}
                        </span>{" "}
                        · {a.event} · sess {a.session_id}
                        {a.lead_id ? ` · lead ${a.lead_id.slice(0, 12)}` : ""}
                      </li>
                    ))}
                    {!data.activity.length ? (
                      <li>Henüz aktivite yok</li>
                    ) : null}
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {sub === "dropoff" && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-rm-off-white">
                İnsanlar nerede çıkıyor?
              </h3>
              <p className="text-xs text-rm-gray-500">
                Ort. aktif kalma: sekme arkadayken geçen süre ve 30 sn+ boşluklar
                dahil edilmez. Kaydırma sayıları yeni ziyaretlerden dolar.
              </p>
              {data.drop_off.map((d) => (
                <div
                  key={d.key}
                  className="rounded-xl border border-white/8 bg-white/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-medium text-rm-off-white">{d.label}</p>
                    <p className="text-sm tabular-nums text-rm-champagne">
                      {d.count} · {pct(d.rate)}
                    </p>
                  </div>
                  <p className="mt-1 text-xs text-rm-gray-500">
                    Ort. aktif kalma: {fmtSec(d.avgDwellSec)} · Son işlem:{" "}
                    {d.lastAction}
                  </p>
                  <p className="mt-1 text-xs text-rm-gray-400">
                    Gördü: paketler {d.scroll?.packages ?? 0}/{d.count}
                    {" · "}
                    plato {d.scroll?.plato ?? 0}/{d.count}
                    {" · "}
                    DEVAM {d.scroll?.continueBtn ?? 0}/{d.count}
                  </p>
                  <p className="mt-1 text-xs text-rm-gray-500">
                    Cihaz:{" "}
                    {Object.entries(d.devices)
                      .map(([k, v]) => `${k} ${v}`)
                      .join(" · ") || "—"}
                  </p>
                  <p className="mt-1 text-xs text-rm-gray-500">
                    Kaynak:{" "}
                    {Object.entries(d.sources)
                      .slice(0, 4)
                      .map(([k, v]) => `${k} ${v}`)
                      .join(" · ") || "—"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {sub === "sessions" && (
            <AdminSessionsView
              sessions={data.sessions}
              adBuckets={data.ad_buckets}
              sessionId={sessionId}
              detail={detail}
              onSelect={(id) => {
                setDetail(null);
                setSessionId(id);
              }}
            />
          )}

          {sub === "ads" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {data.traffic.map((t) => (
                  <span
                    key={t.name}
                    className="rounded-full bg-white/5 px-3 py-1 text-xs text-rm-gray-300"
                  >
                    {t.name}: {t.count}
                  </span>
                ))}
              </div>
              <div className="overflow-x-auto rounded-xl border border-white/8">
                <table className="w-full min-w-[720px] text-left text-xs">
                  <thead className="bg-white/[0.03] text-rm-gray-500">
                    <tr>
                      <th className="p-2">Kaynak</th>
                      <th className="p-2">Kampanya</th>
                      <th className="p-2">Ziyaret</th>
                      <th className="p-2">Başladı</th>
                      <th className="p-2">Checkout</th>
                      <th className="p-2">Rezervasyon</th>
                      <th className="p-2">Oran</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.campaigns.map((c) => (
                      <tr
                        key={`${c.source}-${c.campaign}`}
                        className="border-t border-white/5"
                      >
                        <td className="p-2">{c.source}</td>
                        <td className="p-2">{c.campaign}</td>
                        <td className="p-2 tabular-nums">{c.page}</td>
                        <td className="p-2 tabular-nums">{c.start}</td>
                        <td className="p-2 tabular-nums">{c.checkout}</td>
                        <td className="p-2 tabular-nums">{c.reserve}</td>
                        <td className="p-2 tabular-nums">
                          {pct(c.reserveRate)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Card title="Cihaz">
                  <ul className="space-y-1 text-sm">
                    {data.devices.map((d) => (
                      <li key={d.device} className="flex justify-between">
                        <span>{d.device}</span>
                        <span className="tabular-nums text-rm-gray-400">
                          {d.page} ziyaret · {d.reserve} rez · {pct(d.rate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card title="İşletim sistemi">
                  <ul className="space-y-1 text-sm">
                    {data.os.map((d) => (
                      <li key={d.os} className="flex justify-between">
                        <span>{d.os}</span>
                        <span className="tabular-nums text-rm-gray-400">
                          {d.page} · {d.reserve} · {pct(d.rate)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>
          )}

          {sub === "forms" && (
            <Card title="En sık form hataları">
              {!errors?.form_errors?.length && !data.form_errors.length ? (
                <p className="text-sm text-rm-gray-500">Kayıt yok</p>
              ) : (
                <ul className="space-y-2 text-sm">
                  {(errors?.form_errors ?? data.form_errors).map((f) => (
                    <li
                      key={f.label}
                      className="flex justify-between border-b border-white/5 py-1.5"
                    >
                      <span>{f.label}</span>
                      <span className="tabular-nums text-rm-champagne">
                        {f.count}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}

          {sub === "tech" && (
            <div className="overflow-x-auto rounded-xl border border-white/8">
              <table className="w-full min-w-[720px] text-left text-xs">
                <thead className="bg-white/[0.03] text-rm-gray-500">
                  <tr>
                    <th className="p-2">Tip</th>
                    <th className="p-2">Mesaj</th>
                    <th className="p-2">Adet</th>
                    <th className="p-2">Step</th>
                    <th className="p-2">Cihaz</th>
                    <th className="p-2">Son</th>
                  </tr>
                </thead>
                <tbody>
                  {(errors?.tech_errors ?? []).map((e) => (
                    <tr key={e.id} className="border-t border-white/5">
                      <td className="p-2">{e.error_type}</td>
                      <td className="max-w-[240px] truncate p-2 text-rm-gray-400">
                        {e.message}
                      </td>
                      <td className="p-2 tabular-nums">{e.count}</td>
                      <td className="p-2">{e.funnel_step ?? "—"}</td>
                      <td className="p-2">
                        {e.device}/{e.browser}
                      </td>
                      <td className="p-2 tabular-nums">
                        {new Date(e.last_seen_at).toLocaleString("tr-TR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!errors?.tech_errors?.length ? (
                <p className="p-4 text-sm text-rm-gray-500">Teknik hata yok</p>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  small,
}: {
  label: string;
  value: string;
  small?: boolean;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <p className="text-[10px] font-semibold tracking-wider text-rm-gray-500 uppercase">
        {label}
      </p>
      <p
        className={`mt-1 font-semibold text-rm-off-white ${small ? "text-sm" : "text-2xl tabular-nums"}`}
      >
        {value}
      </p>
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-white/8 bg-white/[0.02] p-4">
      <h3 className="mb-3 text-xs font-semibold tracking-wider text-rm-gray-500 uppercase">
        {title}
      </h3>
      {children}
    </div>
  );
}
