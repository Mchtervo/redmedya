import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import type { AvailabilityLevel } from "@/config/pricing";

/**
 * Dosya tabanlı müsaitlik — data/availability.json.
 * Admin panel gerekmez; JSON'u düzenleyip deploy et yeter.
 */
export type AvailabilityMap = Record<
  string,
  { level: AvailabilityLevel; message: string }
>;

export async function GET() {
  try {
    const raw = await readFile(
      path.join(process.cwd(), "data", "availability.json"),
      "utf-8"
    );
    const parsed = JSON.parse(raw) as AvailabilityMap;
    return NextResponse.json(parsed, {
      headers: { "Cache-Control": "public, max-age=300" },
    });
  } catch {
    return NextResponse.json({});
  }
}
