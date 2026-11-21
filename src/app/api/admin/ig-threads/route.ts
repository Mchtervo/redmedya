/** Panel: Instagram DM sohbetlerinin kısa durumu (isim, kullanıcı adı, aşama, özet) */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { threadsOverview } from "@/lib/ai-couples/ig-agent";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  return NextResponse.json({ ok: true, threads: await threadsOverview(60) });
}
