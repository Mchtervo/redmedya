/** Bekleyen cevap önerileri (Bearer AI anahtarı) — kontrol amaçlı, panel listesinin aynısı */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { listPendingDrafts } from "@/lib/ai-couples/wa-drafts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, drafts: await listPendingDrafts() });
}
