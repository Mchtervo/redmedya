import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import type { RehberContact } from "@/types/reservations";
import type { ReservationRecord } from "@/types/reservations";

const PATH = path.join(process.cwd(), "data", "rehber.json");

export async function readRehber(): Promise<RehberContact[]> {
  try {
    const raw = await readFile(PATH, "utf-8");
    const parsed = JSON.parse(raw) as RehberContact[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeRehber(list: RehberContact[]): Promise<void> {
  await mkdir(path.dirname(PATH), { recursive: true });
  await writeFile(PATH, JSON.stringify(list, null, 2), "utf-8");
}

export async function upsertFromReservation(
  reservation: ReservationRecord
): Promise<void> {
  const list = await readRehber();
  const phone = reservation.customer.phone?.replace(/\D/g, "") ?? "";
  const existingIdx = list.findIndex((c) => {
    if (c.reservationId === reservation.id) return true;
    if (!phone) return false;
    return c.phone.replace(/\D/g, "") === phone;
  });
  const entry: RehberContact = {
    id: existingIdx >= 0 ? list[existingIdx].id : `rehber-${Date.now()}`,
    firstName: reservation.customer.firstName,
    lastName: reservation.customer.lastName,
    phone: reservation.customer.phone,
    weddingDate: reservation.customer.weddingDate || undefined,
    note: reservation.customer.note || reservation.shootingNote,
    shootingLocation: reservation.shootingLocation,
    shootingNote: reservation.shootingNote,
    reservationId: reservation.id,
    source: "reservation",
    createdAt:
      existingIdx >= 0 ? list[existingIdx].createdAt : new Date().toISOString(),
  };
  if (existingIdx >= 0) list[existingIdx] = entry;
  else list.unshift(entry);
  await writeRehber(list);
}

export async function addManualContact(
  data: Omit<RehberContact, "id" | "createdAt" | "source">
): Promise<RehberContact> {
  const list = await readRehber();
  const entry: RehberContact = {
    ...data,
    id: `rehber-${Date.now()}`,
    source: "manual",
    createdAt: new Date().toISOString(),
  };
  list.unshift(entry);
  await writeRehber(list);
  return entry;
}

export async function getRehberById(
  id: string
): Promise<RehberContact | undefined> {
  return (await readRehber()).find((c) => c.id === id);
}

export async function updateRehberContact(
  id: string,
  patch: Partial<RehberContact>
): Promise<RehberContact | null> {
  const list = await readRehber();
  const idx = list.findIndex((c) => c.id === id);
  if (idx < 0) return null;
  list[idx] = { ...list[idx], ...patch };
  await writeRehber(list);
  return list[idx];
}

export async function removeRehberByReservationId(
  reservationId: string
): Promise<void> {
  const list = await readRehber();
  const next = list.filter((c) => c.reservationId !== reservationId);
  if (next.length !== list.length) await writeRehber(next);
}

export async function deleteRehberContact(id: string): Promise<boolean> {
  const list = await readRehber();
  const next = list.filter((c) => c.id !== id);
  if (next.length === list.length) return false;
  await writeRehber(next);
  return true;
}
