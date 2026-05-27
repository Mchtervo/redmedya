import { NextResponse } from "next/server";
import { readReservations } from "@/lib/reservations-store";
import {
  reservationToPublicPreview,
  sortPublicWeddings,
} from "@/lib/reservation-public";

export async function GET() {
  const list = await readReservations();
  const previews = list
    .map(reservationToPublicPreview)
    .filter((p): p is NonNullable<typeof p> => p != null);
  return NextResponse.json(sortPublicWeddings(previews));
}
