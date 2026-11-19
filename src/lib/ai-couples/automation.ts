/**
 * Otomasyon hız ayarları (panelden değişir, n8n her turda okur):
 *  - WhatsApp kampanyası: günde kaç kişi, kişiler arası kaç–kaç dakika (rastgele; WhatsApp engel riskini azaltır)
 *  - Sesli arama: günde en fazla kaç arama, iki arama arası en az kaç dakika
 * Yeni gelen talepler (Düğün.com / Instagram / web) WhatsApp sınırına takılmaz — hız için.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";

const FILE = dataPath("ai-automation.json");

export type AiAutomation = {
  /** Kampanya listesine günde en fazla kaç kişiye WhatsApp */
  waPerDay: number;
  /** İki kampanya mesajı arası en az / en çok dakika (aradan rastgele) */
  waGapMin: number;
  waGapMax: number;
  /** Günde en fazla kaç sesli arama */
  callsPerDay: number;
  /** İki arama arası en az kaç dakika */
  callGapMin: number;
  updatedAt?: string;
};

export const AUTOMATION_DEFAULT: AiAutomation = { waPerDay: 25, waGapMin: 5, waGapMax: 9, callsPerDay: 40, callGapMin: 2 };

export const AUTOMATION_LIMITS = {
  waPerDay: [1, 100],
  waGapMin: [2, 120],
  waGapMax: [2, 180],
  callsPerDay: [1, 300],
  callGapMin: [2, 120],
} as const;

const clamp = (v: unknown, [lo, hi]: readonly [number, number], fallback: number) => {
  const n = Number(v);
  return v !== undefined && v !== null && v !== "" && Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : fallback;
};

export function cleanAutomation(input: Partial<Record<keyof AiAutomation, unknown>>, cur: AiAutomation): AiAutomation {
  const next: AiAutomation = {
    waPerDay: clamp(input.waPerDay, AUTOMATION_LIMITS.waPerDay, cur.waPerDay),
    waGapMin: clamp(input.waGapMin, AUTOMATION_LIMITS.waGapMin, cur.waGapMin),
    waGapMax: clamp(input.waGapMax, AUTOMATION_LIMITS.waGapMax, cur.waGapMax),
    callsPerDay: clamp(input.callsPerDay, AUTOMATION_LIMITS.callsPerDay, cur.callsPerDay),
    callGapMin: clamp(input.callGapMin, AUTOMATION_LIMITS.callGapMin, cur.callGapMin),
  };
  if (next.waGapMax < next.waGapMin) next.waGapMax = next.waGapMin;
  return next;
}

export async function readAutomation(): Promise<AiAutomation> {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf-8")) as Partial<AiAutomation>;
    return { ...cleanAutomation(raw, AUTOMATION_DEFAULT), updatedAt: raw.updatedAt };
  } catch {
    return { ...AUTOMATION_DEFAULT };
  }
}

export async function writeAutomation(a: AiAutomation): Promise<AiAutomation> {
  await mkdir(path.dirname(FILE), { recursive: true });
  const out = { ...a, updatedAt: new Date().toISOString() };
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(out, null, 2), "utf-8");
  await rename(tmp, FILE);
  return out;
}
