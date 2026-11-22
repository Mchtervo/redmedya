/** Panel: bekleyen cevap önerileri (WhatsApp + Instagram) + önerisi olmadan cevap bekleyen müşteriler */
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/admin-api";
import { listPendingDrafts } from "@/lib/ai-couples/wa-drafts";
import { readCouples } from "@/lib/ai-couples/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdminSession();
  if (!auth.ok) return auth.response;
  const drafts = await listPendingDrafts();
  const withDraft = new Set(drafts.map((d) => d.coupleId).filter(Boolean));
  const now = Date.now();
  // Önerisi olmayan ama son mesajı müşteriden olan (son 3 gün) — siz dönmelisiniz
  const waiting = (await readCouples())
    .filter((c) => !c.contactLocked && c.sourceRef !== "test" && c.status !== "lost" && !withDraft.has(c.id))
    .map((c) => ({ c, last: c.messages[c.messages.length - 1] }))
    .filter(({ last }) => last && last.direction === "in" && now - Date.parse(last.at) < 3 * 86400_000)
    .sort((a, b) => b.last!.at.localeCompare(a.last!.at))
    .slice(0, 30)
    .map(({ c, last }) => ({ id: c.id, name: c.name, phone: c.phone, at: last!.at, text: last!.text.slice(0, 300), channel: last!.channel, summary: c.aiSummary ?? null }));
  return NextResponse.json({ ok: true, drafts, waiting });
}
