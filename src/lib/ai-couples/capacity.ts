/**
 * AYLIK kontenjan — GERÇEK veri:
 *   kalan = aylık kapasite − (o aydaki rezervasyonlar + elle girilen dolu yer)
 * Sesli asistan ve takip mesajları bu rakamı kullanır; uydurma sayı yok.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { readReservations } from "@/lib/reservations-store";
import type { AiCapacityConfig, AiCapacityInfo, AiDateCheck } from "@/types/ai-couples";

const FILE = dataPath("ai-capacity.json");
const MONTH_KEY = /^\d{4}-(0[1-9]|1[0-2])$/;
const DAY_KEY = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

const DEFAULT: AiCapacityConfig = {
  defaultPerMonth: 10,
  months: {},
  manualBooked: {},
  droneGiftLeft: 10,
  perDay: 1,
  blockedDates: [],
  updatedAt: new Date(0).toISOString(),
};

/** Aynı gün kaç düğün (1–10) */
export function cleanPerDay(v: unknown, fallback: number): number {
  const n = Number(v);
  return v !== undefined && v !== null && v !== "" && Number.isFinite(n) && n >= 1 && n <= 10 ? Math.round(n) : fallback;
}

/** Kapalı günler: sadece geçerli YYYY-MM-DD, tekrarsız, sıralı, en fazla 500 */
export function cleanBlockedDates(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return [...new Set(v.map((x) => String(x).slice(0, 10)).filter((x) => DAY_KEY.test(x)))].sort().slice(0, 500);
}

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
      perDay: cleanPerDay(raw.perDay, 1),
      blockedDates: cleanBlockedDates(raw.blockedDates),
      updatedAt: raw.updatedAt ?? DEFAULT.updatedAt,
    };
  } catch {
    return { ...DEFAULT };
  }
}

export async function writeCapacityConfig(cfg: AiCapacityConfig): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify({ ...cfg, updatedAt: new Date().toISOString() }, null, 2), "utf-8");
  await rename(tmp, FILE); // yarım yazılmış dosya okunmasın (okuma hatası → varsayılan 10 kontenjan)
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

/* ───────────────────────── Gün bazında müsaitlik ───────────────────────── */

const GUNLER = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

/** "2027-07-17" → "17 Temmuz 2027 Cumartesi" */
export function dayLabel(day: string, withYear = true): string {
  const [y, m, d] = day.split("-").map(Number);
  const wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return `${d} ${MONTHS_TR[m - 1]}${withYear ? ` ${y}` : ""} ${GUNLER[wd]}`;
}

function addDays(day: string, n: number): string {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

function todayIstanbul(): string {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Istanbul" });
}

/** Rezervasyonlardaki düğün günleri → o gün kaç düğün var */
export async function bookedByDay(): Promise<Map<string, number>> {
  const map = new Map<string, number>();
  for (const r of await readReservations()) {
    const d = String(r.customer?.weddingDate ?? "").slice(0, 10);
    if (DAY_KEY.test(d)) map.set(d, (map.get(d) ?? 0) + 1);
  }
  return map;
}

/**
 * Bir günün müsaitliği: geçmiş mi, elle kapatılmış mı, o gün kaç rezervasyon var
 * (günlük kapasite), ayın kontenjanı doldu mu. Müsait değilse ±21 gün içinde en yakın
 * 3 müsait tarihi önerir (önce aynı haftanın günü, sonra hafta sonları).
 */
export async function checkDate(dateIn: string, cfgIn?: AiCapacityConfig): Promise<AiDateCheck | null> {
  const date = String(dateIn).slice(0, 10);
  if (!DAY_KEY.test(date)) return null;
  const cfg = cfgIn ?? (await readCapacityConfig());
  const perDay = cfg.perDay ?? 1;
  const blocked = new Set(cfg.blockedDates ?? []);
  const [byDay, byMonth] = await Promise.all([bookedByDay(), bookedByMonth()]);
  const today = todayIstanbul();
  const monthOf = (d: string) => infoFor(d.slice(0, 7), cfg, byMonth);
  const status = (d: string): AiDateCheck["reason"] => {
    if (d < today) return "gecmis";
    if (blocked.has(d)) return "kapali";
    if ((byDay.get(d) ?? 0) >= perDay) return "dolu";
    if (monthOf(d).remaining <= 0) return "ay_dolu";
    return "musait";
  };

  const reason = status(date);
  const month = monthOf(date);
  const available = reason === "musait";
  const alternatives: AiDateCheck["alternatives"] = [];
  if (!available && reason !== "gecmis") {
    const wd = new Date(`${date}T12:00:00Z`).getUTCDay();
    const cands: string[] = [];
    for (let i = 1; i <= 21; i++) cands.push(addDays(date, i), addDays(date, -i));
    const score = (d: string) => {
      const w = new Date(`${d}T12:00:00Z`).getUTCDay();
      const pref = w === wd ? 0 : w === 0 || w === 5 || w === 6 ? 1 : 2;
      return pref * 100 + Math.abs(Date.parse(d) - Date.parse(date)) / 86_400_000;
    };
    for (const d of cands.sort((a, b) => score(a) - score(b))) {
      if (status(d) === "musait") alternatives.push({ date: d, dateLabel: dayLabel(d, d.slice(0, 4) !== date.slice(0, 4)) });
      if (alternatives.length >= 3) break;
    }
  }

  const label = dayLabel(date);
  const alt = alternatives.length ? ` Yakın müsait tarihler: ${alternatives.map((a) => a.dateLabel).join(", ")}.` : "";
  const cevap =
    reason === "musait"
      ? `${label} müsait. ${month.monthLabel} için son ${month.remaining} yerimiz var.`
      : reason === "dolu"
        ? `${label} maalesef dolu.${alt}`
        : reason === "ay_dolu"
          ? `${month.monthLabel} kontenjanımız doldu.${alt}`
          : reason === "kapali"
            ? `${label} için çekim alamıyoruz.${alt}`
            : `${label} geçmiş bir tarih; tarihi tekrar teyit edin.`;

  return { date, dateLabel: label, available, reason, bookedOnDate: byDay.get(date) ?? 0, perDay, month, alternatives, cevap };
}
