/**
 * AYLIK kontenjan — GERÇEK veri:
 *   kalan = aylık kapasite − (o aydaki rezervasyonlar + elle girilen dolu yer)
 * Sesli asistan ve takip mesajları bu rakamı kullanır; uydurma sayı yok.
 */
import { mkdir, readFile, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readReservations } from "@/lib/reservations-store";
import type { AiCapacityConfig, AiCapacityInfo } from "@/types/ai-couples";

const FILE = dataPath("ai-capacity.json");
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;

const DEFAULT: AiCapacityConfig = {
  defaultPerMonth: 10,
  months: {},
  manualBooked: {},
  droneGiftLeft: 10,
  updatedAt: new Date(0).toISOString(),
};

export function cleanGiftLeft(v: unknown, fallback: number): number {
  const n = Number(v);
  return v !== undefined && v !== null && v !== "" && Number.isFinite(n) && n >= 0 && n <= 100 ? Math.round(n) : fallback;
}

/** Sadece YYYY-MM anahtarlarını tutar (eski haftalık kayıtlar yok sayılır). */
function monthMap(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!v || typeof v !== "object") return out;
  for (const [k, n] of Object.entries(v as Record<string, unknown>)) {
    const num = Number(n);
    if (MONTH_KEY.test(k) && Number.isFinite(num) && num >= 0 && num <= 200) out[k] = Math.round(num);
  }
  return out;
}

export async function readCapacityConfig(): Promise<AiCapacityConfig> {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf-8")) as Partial<AiCapacityConfig>;
    const def = Number(raw.defaultPerMonth);
    return {
      defaultPerMonth: Number.isFinite(def) && def >= 0 ? def : DEFAULT.defaultPerMonth,
      months: monthMap(raw.months),
      manualBooked: monthMap(raw.manualBooked),
      droneGiftLeft: cleanGiftLeft(raw.droneGiftLeft, DEFAULT.droneGiftLeft),
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

export { monthMap as cleanMonthMap };

export const MONTHS_TR = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

/** "2027-06-14" → "2027-06" */
export function monthKeyOf(dateStr: string | undefined): string | null {
  const m = dateStr?.match(/^(\d{4})-(\d{2})/);
  if (!m || !MONTH_KEY.test(`${m[1]}-${m[2]}`)) return null;
  return `${m[1]}-${m[2]}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return `${MONTHS_TR[m - 1]} ${y}`;
}

async function bookedByMonth(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const r of await readReservations()) {
    const k = monthKeyOf(r.customer?.weddingDate);
    if (k) map.set(k, (map.get(k) ?? 0) + 1);
  }
  return map;
}

function infoFor(key: string, cfg: AiCapacityConfig, reserved: Map<string, number>): AiCapacityInfo {
  const total = cfg.months[key] ?? cfg.defaultPerMonth;
  const booked = (reserved.get(key) ?? 0) + (cfg.manualBooked[key] ?? 0);
  return { monthKey: key, monthLabel: monthLabel(key), total, booked, remaining: Math.max(0, total - booked) };
}

export async function getCapacityForDate(
  weddingDate: string | undefined,
  cfgIn?: AiCapacityConfig
): Promise<AiCapacityInfo | null> {
  const key = monthKeyOf(weddingDate);
  if (!key) return null;
  const cfg = cfgIn ?? (await readCapacityConfig());
  return infoFor(key, cfg, await bookedByMonth());
}

/** Bu aydan itibaren N ay için kontenjan tablosu (panel, Telegram, sesli asistan). */
export async function upcomingCapacity(months = 14, cfgIn?: AiCapacityConfig): Promise<AiCapacityInfo[]> {
  const cfg = cfgIn ?? (await readCapacityConfig());
  const reserved = await bookedByMonth();
  const now = new Date();
  const ist = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Istanbul" }));
  const out: AiCapacityInfo[] = [];
  for (let i = 0; i < months; i++) {
    const d = new Date(ist.getFullYear(), ist.getMonth() + i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    out.push(infoFor(key, cfg, reserved));
  }
  return out;
}

/**
 * Sesli asistan için kısa, gerçek kontenjan cümlesi:
 * "Mayıs 2027'de 3, Haziran 2027'de 2, Temmuz 2027'de 5 yerimiz kaldı"
 * Önce çiftin ayı, sonra en çok dolan aylar (en fazla 4 ay).
 */
export function capacitySpeech(list: AiCapacityInfo[], coupleMonth?: string | null): string {
  const open = list.filter((m) => m.total > 0);
  const pick: AiCapacityInfo[] = [];
  const own = coupleMonth ? open.find((m) => m.monthKey === coupleMonth) : undefined;
  if (own) pick.push(own);
  for (const m of [...open].sort((a, b) => a.remaining - b.remaining || a.monthKey.localeCompare(b.monthKey))) {
    if (pick.length >= 4) break;
    if (!pick.includes(m) && m.remaining < m.total) pick.push(m);
  }
  // Hiç dolmuş ay yoksa yine gerçek sayıyı söyle: önümüzdeki ilk 3 ay
  if (!pick.length) pick.push(...open.slice(0, 3));
  if (!pick.length) return "";
  return pick
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .map((m) => (m.remaining <= 0 ? `${m.monthLabel} tamamen doldu` : `${m.monthLabel} için ${m.remaining} çiftlik yer kaldı`))
    .join(", ");
}
