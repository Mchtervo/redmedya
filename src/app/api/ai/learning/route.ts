/** Asistanın sahibinden öğrendikleri: GET (Bearer AI anahtarı) → kurallar + örnek sayısı */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { learningStatus } from "@/lib/ai-couples/wa-learning";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await learningStatus()) });
}
