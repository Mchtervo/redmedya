/**
 * Haftalık kontenjan — GERÇEK veri:
 *   kalan = haftalık kapasite − (o haftadaki onaylı rezervasyonlar + elle girilen dolu yer)
 * Sesli asistan ve takip mesajları bu rakamı kullanır; uydurma sayı yok.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readReservations } from "@/lib/reservations-store";
import type { AiCapacityConfig, AiCapacityInfo } from "@/types/ai-couples";

const FILE = dataPath("ai-capacity.json");

const DEFAULT: AiCapacityConfig = {
  defaultPerWeek: 6,
  weeks: {},
  manualBooked: {},
  updatedAt: new Date(0).toISOString(),
};

export async function readCapacityConfig(): Promise<AiCapacityConfig> {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf-8")) as Partial<AiCapacityConfig>;
    return {
      defaultPerWeek: Number.isFinite(raw.defaultPerWeek) ? Number(raw.defaultPerWeek) : DEFAULT.defaultPerWeek,
      weeks: raw.weeks ?? {},
      manualBooked: raw.manualBooked ?? {},
      updatedAt: raw.updatedAt ?? DEFAULT.updatedAt,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export async function writeCapacityConfig(cfg: AiCapacityConfig): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  await writeFile(FILE, JSON.stringify({ ...cfg, updatedAt: new Date().toISOString() }, null, 2), "utf-8");
}

function parseYmd(d: string): Date | null {
  const m = d.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
}

/** ISO hafta anahtarı (2026-W23) ve haftanın Pazartesi'si. */
export function isoWeek(dateStr: string): { key: string; monday: Date } | null {
  const d = parseYmd(dateStr);
  if (!d) return null;
  const day = d.getUTCDay() || 7;
  const monday = new Date(d.getTime() - (day - 1) * 86_400_000);
  const thursday = new Date(monday.getTime() + 3 * 86_400_000);
  const year = thursday.getUTCFullYear();
  const jan1 = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((thursday.getTime() - jan1.getTime()) / 86_400_000 + 1) / 7);
  return { key: `${year}-W${String(week).padStart(2, "0")}`, monday };
}

const MONTHS = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

function weekLabel(monday: Date): string {
  const sunday = new Date(monday.getTime() + 6 * 86_400_000);
  const a = `${monday.getUTCDate()} ${MONTHS[monday.getUTCMonth()]}`;
  const b = `${sunday.getUTCDate()} ${MONTHS[sunday.getUTCMonth()]}`;
  return `${a} – ${b}`;
}

export async function getCapacityForDate(
  weddingDate: string | undefined,
  cfgIn?: AiCapacityConfig
): Promise<AiCapacityInfo | null> {
  if (!weddingDate) return null;
  const wk = isoWeek(weddingDate);
  if (!wk) return null;
  const cfg = cfgIn ?? (await readCapacityConfig());
  const reservations = await readReservations();
  const reserved = reservations.filter((r) => {
    const rw = r.customer?.weddingDate ? isoWeek(r.customer.weddingDate) : null;
    return rw?.key === wk.key;
  }).length;
  const total = cfg.weeks[wk.key] ?? cfg.defaultPerWeek;
  const booked = reserved + (cfg.manualBooked[wk.key] ?? 0);
  return {
    weekKey: wk.key,
    weekLabel: weekLabel(wk.monday),
    total,
    booked,
    remaining: Math.max(0, total - booked),
  };
}

/** Bugünden itibaren N hafta için kontenjan tablosu (panel + Telegram). */
export async function upcomingCapacity(weeks = 12): Promise<AiCapacityInfo[]> {
  const cfg = await readCapacityConfig();
  const out: AiCapacityInfo[] = [];
  const now = new Date();
  for (let i = 0; i < weeks; i++) {
    const d = new Date(now.getTime() + i * 7 * 86_400_000);
    const ymd = d.toISOString().slice(0, 10);
    const info = await getCapacityForDate(ymd, cfg);
    if (info && !out.some((o) => o.weekKey === info.weekKey)) out.push(info);
  }
  return out;
}
