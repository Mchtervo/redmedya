import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { dataPath } from "@/lib/data-dir";
import type { ReservationRecord } from "@/types/reservations";

const PATH = dataPath("reservations.json");
const MAX = 500;

export async function readReservations(): Promise<ReservationRecord[]> {
  try {
    const raw = await readFile(PATH, "utf-8");
    const parsed = JSON.parse(raw) as ReservationRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Emniyet kemeri: üzerine yazmadan ÖNCE mevcut dosyayı yedekle.
 * Kayıt sayısı azalıyorsa ayrıca tarihli bir kopya bırak (yanlışlıkla
 * silinen rezervasyonlar geri alınabilsin).
 */
async function backupBeforeWrite(nextCount: number): Promise<void> {
  let current: string;
  try {
    current = await readFile(PATH, "utf-8");
  } catch {
    return; // dosya yok — yedeklenecek bir şey de yok
  }

  const dir = path.join(path.dirname(PATH), "backups");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, "reservations.prev.json"), current, "utf-8");

  let prevCount = 0;
  try {
    const parsed = JSON.parse(current) as unknown;
    if (Array.isArray(parsed)) prevCount = parsed.length;
  } catch {
    prevCount = 0;
  }

  if (prevCount > nextCount) {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    await writeFile(
      path.join(dir, `reservations-${stamp}-${prevCount}kayit.json`),
      current,
      "utf-8"
    );
    console.warn(
      `[reservations] kayit sayisi ${prevCount} -> ${nextCount} dustu, yedek alindi`
    );
  }
}

export async function writeReservations(
  list: ReservationRecord[]
): Promise<void> {
  await mkdir(path.dirname(PATH), { recursive: true });
  const next = list.slice(0, MAX);
  await backupBeforeWrite(next.length);
  await writeFile(PATH, JSON.stringify(next, null, 2), "utf-8");
}

export async function appendReservation(
  record: ReservationRecord
): Promise<void> {
  const list = await readReservations();
  await writeReservations([record, ...list]);
}

export async function getReservationById(
  id: string
): Promise<ReservationRecord | undefined> {
  return (await readReservations()).find((r) => r.id === id);
}

export async function updateReservation(
  id: string,
  patch: Partial<ReservationRecord>
): Promise<ReservationRecord | null> {
  const list = await readReservations();
  const idx = list.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  const cur = list[idx];
  const next: ReservationRecord = {
    ...cur,
    ...patch,
    customer: patch.customer ? { ...cur.customer, ...patch.customer } : cur.customer,
    services: patch.services ?? cur.services,
  };
  next.remainingAmount = Math.max(0, next.total - next.depositAmount);
  list[idx] = next;
  await writeReservations(list);
  return next;
}

export async function deleteReservation(id: string): Promise<boolean> {
  const list = await readReservations();
  const next = list.filter((r) => r.id !== id);
  if (next.length === list.length) return false;
  await writeReservations(next);
  return true;
}
