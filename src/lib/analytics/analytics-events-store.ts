import { readFile, writeFile, appendFile, mkdir, stat } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { RETENTION } from "@/config/retention";
import type { AnalyticsEvent } from "@/lib/analytics/types";

const FILE = dataPath("analytics_events.jsonl");

type CacheEntry = {
  mtimeMs: number;
  size: number;
  rows: AnalyticsEvent[];
  loadedAt: number;
};

let cache: CacheEntry | null = null;
const CACHE_TTL_MS = 5_000;

function invalidateCache(): void {
  cache = null;
}

export async function insertAnalyticsEvents(
  rows: AnalyticsEvent[]
): Promise<void> {
  if (!rows.length) return;
  await mkdir(path.dirname(FILE), { recursive: true });
  await appendFile(
    FILE,
    rows.map((r) => JSON.stringify(r)).join("\n") + "\n",
    "utf-8"
  );
  invalidateCache();
  await trimRetention();
}

/** 180 gün + satır tavanı — boyut eşiği beklemeden güvenli budama. */
async function trimRetention(): Promise<void> {
  try {
    const s = await stat(FILE);
    // Küçük dosyada her yazışta tam rewrite pahalı; eşik veya çok satırda budanır
    if (s.size < 1_500_000) {
      // Yine de ara sıra (her ~50 yazımda) kontrol etmek için: boyut düşükse skip
      // ancak 8MB eski eşiği kaçırmamak için büyük dosyalarda her zaman
      if (s.size < 400_000) return;
    }
    const raw = await readFile(FILE, "utf-8");
    const cutoff = Date.now() - RETENTION.eventsDays * 864e5;
    const lines = raw
      .split("\n")
      .filter(Boolean)
      .filter((l) => {
        try {
          const e = JSON.parse(l) as AnalyticsEvent;
          return new Date(e.event_time).getTime() >= cutoff;
        } catch {
          return false;
        }
      })
      .slice(-RETENTION.eventsFileMax);
    await writeFile(FILE, lines.join("\n") + (lines.length ? "\n" : ""), "utf-8");
    invalidateCache();
  } catch {
    /* ignore */
  }
}

async function loadAll(): Promise<AnalyticsEvent[]> {
  try {
    const s = await stat(FILE);
    const now = Date.now();
    if (
      cache &&
      cache.mtimeMs === s.mtimeMs &&
      cache.size === s.size &&
      now - cache.loadedAt < CACHE_TTL_MS
    ) {
      return cache.rows;
    }
    const raw = await readFile(FILE, "utf-8");
    const rows = raw
      .split("\n")
      .filter(Boolean)
      .map((l) => {
        try {
          return JSON.parse(l) as AnalyticsEvent;
        } catch {
          return null;
        }
      })
      .filter((r): r is AnalyticsEvent => r != null);
    cache = {
      mtimeMs: s.mtimeMs,
      size: s.size,
      rows,
      loadedAt: now,
    };
    return rows;
  } catch {
    return [];
  }
}

export async function readAnalyticsEvents(
  limit = 15000
): Promise<AnalyticsEvent[]> {
  const rows = await loadAll();
  return rows.slice(-limit);
}

export async function readAnalyticsEventsInRange(
  fromMs: number,
  toMs: number,
  limit = 20000
): Promise<AnalyticsEvent[]> {
  const all = await loadAll();
  const filtered = all.filter((e) => {
    const t = new Date(e.event_time).getTime();
    return t >= fromMs && t <= toMs;
  });
  return filtered.slice(-limit);
}

/** Test / zorunlu budama */
export async function forceTrimAnalyticsEvents(): Promise<void> {
  try {
    const raw = await readFile(FILE, "utf-8");
    const cutoff = Date.now() - RETENTION.eventsDays * 864e5;
    const lines = raw
      .split("\n")
      .filter(Boolean)
      .filter((l) => {
        try {
          const e = JSON.parse(l) as AnalyticsEvent;
          return new Date(e.event_time).getTime() >= cutoff;
        } catch {
          return false;
        }
      })
      .slice(-RETENTION.eventsFileMax);
    await mkdir(path.dirname(FILE), { recursive: true });
    await writeFile(FILE, lines.join("\n") + (lines.length ? "\n" : ""), "utf-8");
    invalidateCache();
  } catch {
    /* ignore */
  }
}
