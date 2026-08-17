"use client";

import { useMemo, useState, type KeyboardEvent } from "react";

type AdBucket = "SITE" | "DM" | "SICAK" | "diger";

export type SessionListRow = {
  session_id: string;
  first?: string;
  last?: string;
  events: number;
  max_step?: string;
  converted: boolean;
  device?: string | null;
  os?: string | null;
  source?: string;
  campaign?: string | null;
  utm_content?: string | null;
  ad_bucket?: AdBucket;
  lead_id?: string | null;
  landing_path?: string | null;
  exit_path?: string | null;
  total_sec?: number;
  is_returning?: boolean | null;
  block_label?: string | null;
  block_reason?: string | null;
  last_completed_label?: string | null;
  scroll_hero?: boolean;
  scroll_packages?: boolean;
  scroll_end?: boolean;
};

export type SessionDetailPayload = {
  abandoned: boolean;
  last_step: string | null;
  session: {
    session_id: string;
    landing_url: string | null;
    last_url: string | null;
    utm: Record<string, string | undefined>;
    device: string | null;
    os: string | null;
    browser: string | null;
    lead_id: string | null;
    converted: boolean;
  } | null;
  journey?: {
    landing_path: string | null;
    exit_path: string | null;
    pages: { path: string; dwell_sec: number }[];
    total_sec: number;
    is_returning: boolean | null;
    device: string | null;
    os: string | null;
    campaign: string | null;
    utm_content: string | null;
    ad_bucket: AdBucket;
    scroll_hero: boolean;
    scroll_packages: boolean;
    scroll_end: boolean;
    last_completed_label: string;
    block_reason: string | null;
    block_label: string | null;
  };
  timeline: {
    event_time: string;
    event_name: string;
    event_label?: string;
    page_url: string | null;
    page_path?: string | null;
    metadata: Record<string, unknown>;
    meta_label?: string | null;
    error_code: string | null;
  }[];
};

const BUCKETS: { id: AdBucket | "all"; label: string }[] = [
  { id: "all", label: "Tümü" },
  { id: "SITE", label: "SITE" },
  { id: "DM", label: "DM" },
  { id: "SICAK", label: "SICAK" },
  { id: "diger", label: "Diğer" },
];

function fmtSec(s: number | undefined) {
  if (s == null || !Number.isFinite(s) || s < 0) return "—";
  if (s < 60) return `${s} sn`;
  const m = Math.floor(s / 60);
  const r = s % 60;
  return r ? `${m} dk ${r} sn` : `${m} dk`;
}

function deviceTr(d: string | null | undefined) {
  if (d === "mobile") return "Mobil";
  if (d === "tablet") return "Tablet";
  if (d === "desktop") return "Masaüstü";
  return d ?? "—";
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
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

export function AdminSessionsView({
  sessions,
  adBuckets,
  sessionId,
  detail,
  onSelect,
}: {
  sessions: SessionListRow[];
  adBuckets?: Record<string, number>;
  sessionId: string | null;
  detail: SessionDetailPayload | null;
  onSelect: (id: string) => void;
}) {
  const [bucket, setBucket] = useState<AdBucket | "all">("all");

  const rows = useMemo(
    () =>
      bucket === "all"
        ? sessions
        : sessions.filter((s) => s.ad_bucket === bucket),
    [sessions, bucket]
  );

  const onRowKey = (id: string, e: KeyboardEvent<HTMLTableRowElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(id);
    }
  };

  const j = detail?.journey;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Reklam kaynağı filtresi">
        {BUCKETS.map((b) => {
          const count =
            b.id === "all"
              ? sessions.length
              : (adBuckets?.[b.id] ??
                sessions.filter((s) => s.ad_bucket === b.id).length);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => setBucket(b.id)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                bucket === b.id
                  ? "bg-rm-champagne/20 text-rm-champagne"
                  : "bg-white/5 text-rm-gray-400 hover:bg-white/10"
              }`}
            >
              {b.label}
              <span className="ml-1 tabular-nums text-rm-gray-500">{count}</span>
            </button>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-x-auto rounded-xl border border-white/8">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead className="bg-white/[0.03] text-rm-gray-500">
              <tr>
                <th className="p-2">Giriş / çıkış</th>
                <th className="p-2">Süre</th>
                <th className="p-2">Cihaz</th>
                <th className="p-2">Kaynak</th>
                <th className="p-2">Ziyaret</th>
                <th className="p-2">Ne yapamadı</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr
                  key={s.session_id}
                  tabIndex={0}
                  aria-label={`Oturum ${s.session_id.slice(0, 8)}`}
                  className={`cursor-pointer border-t border-white/5 hover:bg-white/[0.03] ${
                    sessionId === s.session_id ? "bg-white/[0.05]" : ""
                  }`}
                  onClick={() => onSelect(s.session_id)}
                  onKeyDown={(e) => onRowKey(s.session_id, e)}
                >
                  <td className="p-2 font-mono text-rm-gray-300">
                    <span className="block">{s.landing_path ?? "—"}</span>
                    <span className="block text-rm-gray-500">
                      → {s.exit_path ?? "—"}
                    </span>
                  </td>
                  <td className="p-2 tabular-nums">{fmtSec(s.total_sec)}</td>
                  <td className="p-2">
                    {deviceTr(s.device)}
                    {s.os ? ` / ${s.os}` : ""}
                  </td>
                  <td className="p-2">
                    {s.ad_bucket && s.ad_bucket !== "diger"
                      ? s.ad_bucket
                      : s.source}
                    {s.campaign ? (
                      <span className="block text-rm-gray-500">{s.campaign}</span>
                    ) : null}
                    {s.utm_content ? (
                      <span className="block text-rm-gray-600">{s.utm_content}</span>
                    ) : null}
                  </td>
                  <td className="p-2">
                    {s.is_returning ? "Tekrar" : "Yeni"}
                  </td>
                  <td className="max-w-[180px] p-2 text-rm-gray-400">
                    {s.converted ? (
                      <span className="text-emerald-400">Tamamladı</span>
                    ) : (
                      s.block_label ?? s.last_completed_label ?? s.max_step ?? "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length ? (
            <p className="p-4 text-sm text-rm-gray-500">
              Bu filtrede oturum yok. Onaysız ziyaretler de sayılıyor; yeni trafik
              bekleniyor.
            </p>
          ) : null}
        </div>

        <Card title="Zaman çizelgesi">
          {!sessionId ? (
            <p className="text-sm text-rm-gray-500">
              Soldan bir oturum seçin — tıklanan her adım sırayla görünür.
            </p>
          ) : !detail ? (
            <p className="text-sm text-rm-gray-500">Yükleniyor…</p>
          ) : (
            <div className="space-y-3">
              {detail.abandoned && !detail.session?.converted ? (
                <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-1.5 text-xs text-amber-200">
                  {j?.block_label ??
                    `Terk · son adım: ${detail.last_step ?? "—"}`}
                </p>
              ) : null}

              <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-rm-gray-400">
                <dt>Giriş</dt>
                <dd className="font-mono text-rm-gray-300">
                  {j?.landing_path ?? "—"}
                </dd>
                <dt>Çıkış</dt>
                <dd className="font-mono text-rm-gray-300">
                  {j?.exit_path ?? "—"}
                </dd>
                <dt>Toplam süre</dt>
                <dd className="tabular-nums">{fmtSec(j?.total_sec)}</dd>
                <dt>Ziyaret</dt>
                <dd>{j?.is_returning ? "Tekrar" : "Yeni"}</dd>
                <dt>Kaydırma</dt>
                <dd>
                  {j?.scroll_hero ? "ilk ekran" : "ilk ekran yok"}
                  {" · "}
                  {j?.scroll_packages ? "paketler" : "paket yok"}
                  {" · "}
                  {j?.scroll_end ? "son" : "son yok"}
                </dd>
              </dl>

              {j?.pages?.length ? (
                <ol className="space-y-1 text-[11px] text-rm-gray-400">
                  {j.pages.map((p, i) => (
                    <li key={`${p.path}-${i}`} className="flex justify-between gap-2">
                      <span className="font-mono text-rm-gray-300">{p.path}</span>
                      <span className="tabular-nums">{fmtSec(p.dwell_sec)}</span>
                    </li>
                  ))}
                </ol>
              ) : null}

              <ol className="max-h-80 space-y-2 overflow-y-auto text-xs">
                {detail.timeline.map((e, i) => (
                  <li
                    key={`${e.event_time}-${i}`}
                    className="border-l border-rm-champagne/30 pl-3"
                  >
                    <span className="tabular-nums text-rm-gray-500">
                      {new Date(e.event_time).toLocaleTimeString("tr-TR")}
                    </span>{" "}
                    <span className="font-medium text-rm-off-white">
                      {e.event_label ?? e.event_name}
                    </span>
                    {e.meta_label ? (
                      <span className="text-rm-gray-400"> · {e.meta_label}</span>
                    ) : null}
                    {e.page_path ? (
                      <span className="block font-mono text-[10px] text-rm-gray-600">
                        {e.page_path}
                      </span>
                    ) : null}
                    {e.error_code ? (
                      <span className="text-red-300"> ({e.error_code})</span>
                    ) : null}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
