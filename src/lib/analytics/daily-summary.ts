/**
 * Akşam 21:00 Telegram günlük özeti — PII yok.
 */

import {
  getAddon,
  getPackage,
  getPlato,
  type AddonId,
  type PackageId,
  type PlatoId,
} from "@/config/pricing";
import {
  biggestDropOff,
  buildFunnelStages,
  groupBySession,
} from "@/lib/analytics/funnel-aggregate";
import type { AnalyticsEvent, AnalyticsSession } from "@/lib/analytics/types";
import { adCampaignBucket, type AdBucket } from "@/lib/analytics/session-journey";
import { dayKey } from "@/lib/track/visits-store";

export type NamedCount = { label: string; count: number };

export type DailySnapshot = {
  visitors: number;
  packagesBuilt: number;
  leads: number;
  whatsappClicks: number;
  topPackage: NamedCount | null;
  topPlato: NamedCount | null;
  topExtra: NamedCount | null;
  biggestLoss: { from: string; to: string; rate: number } | null;
  adBuckets: Record<AdBucket, number>;
};

export type IstanbulWindow = {
  dayKey: string;
  fromMs: number;
  toMs: number;
};

function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

function istanbulClock(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Istanbul",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "00";
  return `${get("hour")}:${get("minute")}:${get("second")}`;
}

/** dayOffset 0 = bugün 00:00→şimdi; -1 = dün aynı saate kadar. */
export function istanbulWindowEndingNow(
  now: Date,
  dayOffset: number
): IstanbulWindow {
  const shifted = new Date(now.getTime() + dayOffset * 864e5);
  const key = dayKey(shifted);
  const fromMs = new Date(`${key}T00:00:00+03:00`).getTime();
  const toMs =
    dayOffset === 0
      ? now.getTime()
      : new Date(`${key}T${istanbulClock(now)}+03:00`).getTime();
  return { dayKey: key, fromMs, toMs };
}

export function formatTrDay(key: string): string {
  const [y, m, d] = key.split("-");
  return `${d}.${m}.${y}`;
}

export function formatDelta(today: number, yesterday: number): string {
  if (yesterday === 0 && today === 0) return "→0%";
  if (yesterday === 0) return "↑yeni";
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  if (pct === 0) return "→0%";
  if (pct > 0) return `↑${pct}%`;
  return `↓${Math.abs(pct)}%`;
}

function lastMeta(
  evs: AnalyticsEvent[],
  name: string,
  key: string
): string | null {
  for (let i = evs.length - 1; i >= 0; i--) {
    if (evs[i].event_name !== name) continue;
    const v = evs[i].metadata[key];
    if (v == null || v === "") continue;
    return String(v);
  }
  return null;
}

function topOf(map: Record<string, number>): NamedCount | null {
  let best: NamedCount | null = null;
  for (const [label, count] of Object.entries(map)) {
    if (!best || count > best.count) best = { label, count };
  }
  return best;
}

function packageLabel(raw: string): string {
  const n = Number(raw);
  if (n === 1 || n === 2 || n === 3) {
    try {
      const p = getPackage(n as PackageId);
      return p.name;
    } catch {
      /* fall through */
    }
  }
  return `Paket ${raw}`;
}

function platoLabel(raw: string): string {
  if (raw === "later") return "Sonra karar vereceğim";
  try {
    return getPlato(raw as PlatoId).name;
  } catch {
    return raw;
  }
}

function extraLabel(raw: string): string {
  try {
    return getAddon(raw as AddonId).name;
  } catch {
    return raw;
  }
}

function sessionReached(evs: AnalyticsEvent[], names: string[]): boolean {
  const set = new Set(names);
  return evs.some((e) => set.has(e.event_name));
}

export function buildDailySnapshot(opts: {
  events: AnalyticsEvent[];
  sessions: AnalyticsSession[];
  visitCount: number;
  leadCount: number;
}): DailySnapshot {
  const bySession = groupBySession(opts.events);
  const sessionsMeta = new Map(opts.sessions.map((s) => [s.session_id, s]));
  const visitors = bySession.size || opts.visitCount;

  let packagesBuilt = 0;
  let whatsappClicks = 0;
  let scheduleSessions = 0;
  const pkgMap: Record<string, number> = {};
  const platoMap: Record<string, number> = {};
  const extraMap: Record<string, number> = {};
  const adBuckets: Record<AdBucket, number> = {
    SITE: 0,
    DM: 0,
    SICAK: 0,
    diger: 0,
  };

  for (const [sid, evs] of bySession) {
    if (sessionReached(evs, ["PackageBuild", "PackageSelected"])) {
      packagesBuilt += 1;
    }
    if (sessionReached(evs, ["WhatsAppClick"])) whatsappClicks += 1;
    if (sessionReached(evs, ["Schedule"])) scheduleSessions += 1;

    const pkg = lastMeta(evs, "PackageSelected", "package_id");
    if (pkg) pkgMap[packageLabel(pkg)] = (pkgMap[packageLabel(pkg)] ?? 0) + 1;
    const plato = lastMeta(evs, "PlatoSelected", "plato");
    if (plato) {
      const label = platoLabel(plato);
      platoMap[label] = (platoMap[label] ?? 0) + 1;
    }
    const extra = lastMeta(evs, "ExtraServiceSelected", "addon_id");
    if (extra) {
      const label = extraLabel(extra);
      extraMap[label] = (extraMap[label] ?? 0) + 1;
    }

    const first = evs[0];
    const meta = sessionsMeta.get(sid);
    const campaign =
      meta?.first_touch_utm.utm_campaign ??
      meta?.utm.utm_campaign ??
      first?.utm_campaign;
    const content =
      meta?.first_touch_utm.utm_content ??
      meta?.utm.utm_content ??
      first?.utm_content;
    const bucket = adCampaignBucket(campaign, content);
    adBuckets[bucket] += 1;
  }

  const stages = buildFunnelStages(bySession);
  return {
    visitors,
    packagesBuilt,
    leads: opts.leadCount > 0 ? opts.leadCount : scheduleSessions,
    whatsappClicks,
    topPackage: topOf(pkgMap),
    topPlato: topOf(platoMap),
    topExtra: topOf(extraMap),
    biggestLoss: biggestDropOff(stages),
    adBuckets,
  };
}

function namedLine(title: string, row: NamedCount | null): string {
  if (!row) return `${title}: —`;
  return `${title}: ${row.label} (${row.count})`;
}

export function formatDailySummaryText(
  today: DailySnapshot,
  yesterday: DailySnapshot,
  dayKeyStr: string
): string {
  const d = formatTrDay(dayKeyStr);
  const v = formatDelta(today.visitors, yesterday.visitors);
  const p = formatDelta(today.packagesBuilt, yesterday.packagesBuilt);
  const l = formatDelta(today.leads, yesterday.leads);
  const w = formatDelta(today.whatsappClicks, yesterday.whatsappClicks);

  const loss = today.biggestLoss
    ? `${today.biggestLoss.from} → ${today.biggestLoss.to} (%${Math.round(
        today.biggestLoss.rate * 100
      )})`
    : "—";

  const ad = today.adBuckets;
  return [
    `Günlük özet — ${d}`,
    "",
    `Bugün: ${today.visitors} ziyaretçi (${v}) · ${today.packagesBuilt} paket kuruldu (${p}) · ${today.leads} lead (${l}) · ${today.whatsappClicks} WhatsApp tık (${w})`,
    "",
    "En çok seçilen",
    namedLine("Paket", today.topPackage),
    namedLine("Plato", today.topPlato),
    namedLine("Ekstra", today.topExtra),
    "",
    `En büyük kayıp: ${loss}`,
    "",
    `Reklam: SITE ${ad.SITE} · DM ${ad.DM} · SICAK ${ad.SICAK} · diğer ${ad.diger}`,
  ].join("\n");
}
