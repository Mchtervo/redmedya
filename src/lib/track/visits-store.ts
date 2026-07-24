import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";

/**
 * ANONİM ZİYARET SAYACI — çerez onayından BAĞIMSIZ.
 *
 * KVKK gerekçesi: burada kişisel veri YOK. session_id yok, çerez yok, IP yok,
 * parmak izi yok, kullanıcı bazlı hiçbir kayıt yok. Sadece GÜNLÜK TOPLAM sayılar
 * tutulur (meşru menfaat kapsamında sayaç). Bir ziyaretçiyi diğerinden ayırmak
 * bu veriyle teknik olarak MÜMKÜN DEĞİLDİR.
 *
 * Oturum zaman çizelgesi (journey) ise session_id içerdiği için AÇIK RIZAYA
 * bağlı kalır — bkz. lib/track/tracker.ts.
 */

export type VisitDay = {
  /** Toplam sayfa açılışı */
  total: number;
  /** Bunlardan UTM parametresiyle gelenler (reklam trafiği) */
  utm: number;
  /** utm_campaign → adet */
  campaigns: Record<string, number>;
  /** yol → adet (sorgu dizesi atılır) */
  paths: Record<string, number>;
};

export type VisitsFile = Record<string, VisitDay>; // "YYYY-MM-DD" → sayılar

const FILE = dataPath("visits.json");
const KEEP_DAYS = 400;

/** Sahibinin takvimiyle uyumlu olsun diye gün kovası Türkiye saatine göre */
export function dayKey(d: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

export async function readVisits(): Promise<VisitsFile> {
  try {
    const raw = await readFile(FILE, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed as VisitsFile;
  } catch {
    return {};
  }
}

/** Aynı anda gelen isteklerde kayıp güncelleme olmasın diye seri kuyruk */
let chain: Promise<void> = Promise.resolve();

export type HitInput = {
  path?: string;
  utmSource?: string;
  utmCampaign?: string;
};

export function recordHit(input: HitInput): Promise<void> {
  chain = chain.then(async () => {
    const visits = await readVisits();
    const key = dayKey();
    const day: VisitDay = visits[key] ?? {
      total: 0,
      utm: 0,
      campaigns: {},
      paths: {},
    };

    day.total += 1;

    const campaign = input.utmCampaign?.trim();
    const source = input.utmSource?.trim();
    if (campaign || source) {
      day.utm += 1;
      const label = campaign || source!;
      day.campaigns[label] = (day.campaigns[label] ?? 0) + 1;
    }

    const p = input.path?.trim();
    if (p) day.paths[p] = (day.paths[p] ?? 0) + 1;

    visits[key] = day;

    // Eski günleri buda
    const keys = Object.keys(visits).sort();
    if (keys.length > KEEP_DAYS) {
      for (const k of keys.slice(0, keys.length - KEEP_DAYS)) delete visits[k];
    }

    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, JSON.stringify(visits, null, 2), "utf-8");
  });

  // Bir hata zinciri kilitlemesin
  chain = chain.catch(() => {});
  return chain;
}

export type VisitSummary = {
  today: number;
  todayUtm: number;
  week: number;
  weekUtm: number;
  /** Son 14 gün, eskiden yeniye — mini grafik için */
  daily: { day: string; total: number; utm: number }[];
  topCampaign: string;
};

function lastNDayKeys(n: number): string[] {
  const out: string[] = [];
  const now = Date.now();
  for (let i = n - 1; i >= 0; i--) out.push(dayKey(new Date(now - i * 864e5)));
  return out;
}

export async function summarizeVisits(): Promise<VisitSummary> {
  const visits = await readVisits();
  const empty: VisitDay = { total: 0, utm: 0, campaigns: {}, paths: {} };
  const at = (k: string) => visits[k] ?? empty;

  const weekKeys = lastNDayKeys(7);
  const todayK = dayKey();

  const campaignTotals = new Map<string, number>();
  for (const k of weekKeys) {
    for (const [name, n] of Object.entries(at(k).campaigns)) {
      campaignTotals.set(name, (campaignTotals.get(name) ?? 0) + n);
    }
  }
  let topCampaign = "—";
  let best = 0;
  for (const [name, n] of campaignTotals) {
    if (n > best) {
      best = n;
      topCampaign = name;
    }
  }

  return {
    today: at(todayK).total,
    todayUtm: at(todayK).utm,
    week: weekKeys.reduce((a, k) => a + at(k).total, 0),
    weekUtm: weekKeys.reduce((a, k) => a + at(k).utm, 0),
    daily: lastNDayKeys(14).map((day) => ({
      day,
      total: at(day).total,
      utm: at(day).utm,
    })),
    topCampaign,
  };
}
