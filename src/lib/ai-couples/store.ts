/**
 * AI çift kayıtları — DATA_DIR/ai-couples.json (deploy'da silinmez).
 * Kayıt SİLME fonksiyonu bilerek yoktur. Yazmalar süreç içinde sıraya alınır
 * ve her yazmadan önce bir önceki dosya .bak olarak saklanır.
 */
import { randomUUID } from "crypto";
import { copyFile, mkdir, readFile, rename, writeFile } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import type { AiCouple, AiCoupleSource } from "@/types/ai-couples";
import { normalizePhone } from "@/lib/ai-couples/rules";

const FILE = dataPath("ai-couples.json");

let chain: Promise<unknown> = Promise.resolve();

/** Okuma-değiştirme-yazma işlemlerini tek tek çalıştırır (yarış yok). */
export function withCouplesLock<T>(fn: () => Promise<T>): Promise<T> {
  const run = chain.then(fn, fn);
  chain = run.catch(() => undefined);
  return run;
}

export async function readCouples(): Promise<AiCouple[]> {
  try {
    const parsed = JSON.parse(await readFile(FILE, "utf-8")) as AiCouple[];
    if (!Array.isArray(parsed)) throw new Error("ai-couples.json bozuk (dizi değil)");
    return parsed;
  } catch (e) {
    // Sadece dosya YOKSA boş liste; okuma/bozulma hatasında boş liste dönmek bir sonraki yazmada tüm veriyi silerdi
    if ((e as NodeJS.ErrnoException)?.code === "ENOENT") return [];
    throw e;
  }
}

async function writeCouples(list: AiCouple[]): Promise<void> {
  await mkdir(path.dirname(FILE), { recursive: true });
  // Güvenlik: kayıt sayısı birden yarıdan fazla düşecekse yazma (hatalı okuma sonrası veri kaybını önler)
  try {
    const prev = JSON.parse(await readFile(FILE, "utf-8")) as unknown[];
    if (Array.isArray(prev) && prev.length >= 10 && list.length < prev.length / 2) {
      throw new Error(`Güvenlik: çift sayısı ${prev.length} → ${list.length} düşecekti, yazma iptal`);
    }
  } catch (e) {
    if ((e as Error)?.message?.startsWith("Güvenlik:")) throw e;
  }
  try {
    await copyFile(FILE, `${FILE}.bak`);
  } catch {
    /* ilk yazma */
  }
  const tmp = `${FILE}.tmp`;
  await writeFile(tmp, JSON.stringify(list, null, 2), "utf-8");
  await rename(tmp, FILE);
}

export async function getCouple(id: string): Promise<AiCouple | undefined> {
  return (await readCouples()).find((c) => c.id === id);
}

export async function findCoupleByPhone(phone: string): Promise<AiCouple | undefined> {
  const p = normalizePhone(phone);
  if (!p) return undefined;
  return (await readCouples()).find((c) => c.phone === p);
}

/** Tek çifti kilit altında günceller. */
export function mutateCouple(
  id: string,
  fn: (c: AiCouple) => AiCouple
): Promise<AiCouple | null> {
  return withCouplesLock(async () => {
    const list = await readCouples();
    const idx = list.findIndex((c) => c.id === id);
    if (idx < 0) return null;
    list[idx] = fn(list[idx]);
    await writeCouples(list);
    return list[idx];
  });
}

export type IngestInput = {
  name?: string;
  phone: string;
  weddingDate?: string;
  city?: string;
  source: AiCoupleSource;
  sourceRef?: string;
  note?: string;
};

export type IngestResult =
  | { ok: true; created: boolean; couple: AiCouple }
  | { ok: false; error: string };

function cleanDate(d?: string): string | undefined {
  const m = d?.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  // 14.06.2026 / 14/06/2026
  const tr = d?.trim().match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})/);
  if (tr) return `${tr[3]}-${tr[2].padStart(2, "0")}-${tr[1].padStart(2, "0")}`;
  return undefined;
}

/**
 * Yeni talebi ekler. Aynı telefon varsa yeni kayıt AÇMAZ; eksik bilgileri
 * tamamlar ve zaman çizelgesine not düşer. Kara listedeki kayıt asla açılmaz.
 */
export function ingestCouple(input: IngestInput, now = new Date()): Promise<IngestResult> {
  const phone = normalizePhone(input.phone);
  if (!phone) return Promise.resolve({ ok: false, error: "Geçersiz telefon numarası" });
  const at = now.toISOString();
  const weddingDate = cleanDate(input.weddingDate);
  const name = input.name?.trim().slice(0, 120) || "İsimsiz çift";

  return withCouplesLock(async () => {
    const list = await readCouples();
    const idx = list.findIndex((c) => c.phone === phone);
    if (idx >= 0) {
      const cur = list[idx];
      // Panelden test edilmiş numaradan GERÇEK talep geldi → test etiketi kalkar, gerçek çift gibi aranır/sayılır
      const fromTest = (cur.sourceRef === "test" || /^TEST\s/.test(cur.name)) && input.sourceRef !== "test";
      list[idx] = {
        ...cur,
        // Test kaydı gerçek talebe dönüşür: deneme aramaları/mesajları sayılmaz, yeni gelen talep gibi en baştan işlenir
        ...(fromTest && !cur.contactLocked
          ? {
              source: input.source, sourceRef: input.sourceRef, note: input.note ?? cur.note, name,
              status: "new" as const, grade: "cold" as const, createdAt: at,
              calls: [], messages: [], callCount: 0,
              callbackRequested: false, callbackAt: undefined, busyRetries: 0, followUpAt: undefined, followUpSentAt: undefined,
              callsPaused: false, messagesPaused: false, inboundAt: undefined,
            }
          : {}),
        name: fromTest ? name : cur.name === "İsimsiz çift" ? name : cur.name,
        weddingDate: fromTest ? weddingDate ?? cur.weddingDate : cur.weddingDate ?? weddingDate,
        city: cur.city ?? input.city,
        timeline: [
          ...cur.timeline,
          {
            at,
            type: "duplicate",
            text: `Yeni talep geldi (${input.source}${input.sourceRef ? ` #${input.sourceRef}` : ""})${cur.contactLocked ? " — kara listede, iletişim yok" : ""}`,
          },
        ],
        updatedAt: at,
      };
      await writeCouples(list);
      return { ok: true as const, created: false, couple: list[idx] };
    }
    const couple: AiCouple = {
      id: randomUUID(),
      name,
      phone,
      weddingDate,
      city: input.city?.trim() || undefined,
      source: input.source,
      sourceRef: input.sourceRef?.trim() || undefined,
      note: input.note?.trim().slice(0, 1000) || undefined,
      grade: "cold",
      status: "new",
      contactLocked: false,
      callCount: 0,
      callbackRequested: false,
      calls: [],
      messages: [],
      timeline: [{ at, type: "created", text: `Talep geldi (${input.source})` }],
      createdAt: at,
      updatedAt: at,
    };
    list.unshift(couple);
    await writeCouples(list);
    return { ok: true as const, created: true, couple };
  });
}
