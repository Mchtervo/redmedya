/** Instagram DM sohbetlerinin kısa durumu (Bearer AI anahtarı) */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { threadsOverview } from "@/lib/ai-couples/ig-agent";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, threads: await threadsOverview(100) });
}
