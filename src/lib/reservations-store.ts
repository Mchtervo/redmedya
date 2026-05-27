import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { ReservationRecord } from "@/types/reservations";

const PATH = path.join(process.cwd(), "data", "reservations.json");
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

export async function writeReservations(
  list: ReservationRecord[]
): Promise<void> {
  await mkdir(path.dirname(PATH), { recursive: true });
  await writeFile(PATH, JSON.stringify(list.slice(0, MAX), null, 2), "utf-8");
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
