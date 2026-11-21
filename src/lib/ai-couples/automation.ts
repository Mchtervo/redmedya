/**
 * Otomasyon hız ayarları (panelden değişir, n8n her turda okur):
 *  - WhatsApp kampanyası: günde kaç kişi, kişiler arası kaç–kaç dakika (rastgele; WhatsApp engel riskini azaltır)
 *  - Sesli arama: günde en fazla kaç arama, iki arama arası en az kaç dakika
 * Yeni gelen talepler (Düğün.com / Instagram / web) WhatsApp sınırına takılmaz — hız için.
 */
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import { FOLLOW_DAYS_DEFAULT, setFollowDays } from "@/lib/ai-couples/follow-days";

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
  /** Teklif sonrası cevap vermeyen çift: kaçıncı gün hatırlatma mesajı / takip araması / son mesaj */
  fuMsgDay: number;
  fuCallDay: number;
  fuLastDay: number;
  /** WhatsApp yapay zekâ cevabı: kapalı / sadece test numaraları / herkese */
  /** draft = cevabı yazar ama GÖNDERMEZ, Telegram'dan sahibine öneri olarak iletir */
  waAiMode: "off" | "test" | "draft" | "all";
  /** Test modunda cevap verilecek numaralar (son 10 hane karşılaştırılır) */
  waAiTestPhones: string[];
  /** Instagram DM asistanı: kapalı / sadece test kullanıcı adları / herkese */
  igAiMode: "off" | "test" | "all";
  /** Test modunda cevap verilecek Instagram kullanıcı adları (@ olmadan, küçük harf) */
  igAiTestUsers: string[];
  updatedAt?: string;
};

export const AUTOMATION_DEFAULT: AiAutomation = { waPerDay: 25, waGapMin: 5, waGapMax: 9, callsPerDay: 40, callGapMin: 2, fuMsgDay: FOLLOW_DAYS_DEFAULT.msg, fuCallDay: FOLLOW_DAYS_DEFAULT.call, fuLastDay: FOLLOW_DAYS_DEFAULT.last, waAiMode: "test", waAiTestPhones: [], igAiMode: "test", igAiTestUsers: [] };

export const AUTOMATION_LIMITS = {
  waPerDay: [1, 100],
  waGapMin: [2, 120],
  waGapMax: [2, 180],
  callsPerDay: [1, 300],
  callGapMin: [2, 120],
  fuMsgDay: [1, 30],
  fuCallDay: [1, 45],
  fuLastDay: [1, 60],
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
    fuMsgDay: clamp(input.fuMsgDay, AUTOMATION_LIMITS.fuMsgDay, cur.fuMsgDay),
    fuCallDay: clamp(input.fuCallDay, AUTOMATION_LIMITS.fuCallDay, cur.fuCallDay),
    fuLastDay: clamp(input.fuLastDay, AUTOMATION_LIMITS.fuLastDay, cur.fuLastDay),
    waAiMode: input.waAiMode === "off" || input.waAiMode === "test" || input.waAiMode === "draft" || input.waAiMode === "all" ? input.waAiMode : cur.waAiMode,
    waAiTestPhones: Array.isArray(input.waAiTestPhones)
      ? [...new Set(input.waAiTestPhones.flatMap((p) => String(p).split(/[,;\n]/)).map((p) => p.replace(/\D/g, "").slice(-10)).filter((p) => p.length === 10))].slice(0, 10)
      : cur.waAiTestPhones,
    igAiMode: input.igAiMode === "off" || input.igAiMode === "test" || input.igAiMode === "all" ? input.igAiMode : cur.igAiMode,
    igAiTestUsers: Array.isArray(input.igAiTestUsers)
      ? [...new Set(input.igAiTestUsers.flatMap((u) => String(u).split(/[,; \n]/)).map((u) => u.trim().replace(/^@/, "").toLowerCase()).filter((u) => /^[a-z0-9._]{1,30}$/.test(u)))].slice(0, 10)
      : cur.igAiTestUsers,
  };
  if (next.waGapMax < next.waGapMin) next.waGapMax = next.waGapMin;
  if (next.fuCallDay < next.fuMsgDay) next.fuCallDay = next.fuMsgDay;
  if (next.fuLastDay < next.fuCallDay) next.fuLastDay = next.fuCallDay;
  return next;
}

export async function readAutomation(): Promise<AiAutomation> {
  try {
    const raw = JSON.parse(await readFile(FILE, "utf-8")) as Partial<AiAutomation>;
    const a = { ...cleanAutomation(raw, AUTOMATION_DEFAULT), updatedAt: raw.updatedAt };
    setFollowDays({ msg: a.fuMsgDay, call: a.fuCallDay, last: a.fuLastDay });
    return a;
  } catch {
    return { ...AUTOMATION_DEFAULT };
  }
}

export async function writeAutomation(a: AiAutomation): Promise<AiAutomation> {
  await mkdir(path.dirname(FILE), { recursive: true });
  const out = { ...a, updatedAt: new Date().toISOString() };
  setFollowDays({ msg: a.fuMsgDay, call: a.fuCallDay, last: a.fuLastDay });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(out, null, 2), "utf-8");
  await rename(tmp, FILE);
  return out;
}
