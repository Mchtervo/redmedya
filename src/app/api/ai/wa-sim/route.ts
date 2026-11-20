/**
 * WhatsApp yapay zekâ DENEME ucu — hiçbir kayda dokunmaz, mesaj göndermez.
 * POST (Bearer AI anahtarı) { name, weddingDate?, source?, status?, note?, messages: [{ dir: "in"|"out", text, kind? }] }
 * Sahte bir çift oluşturup yapay zekânın vereceği cevabı döndürür (test senaryoları için).
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad } from "@/lib/ai-couples/http";
import { generateWaReply } from "@/lib/ai-couples/wa-agent";
import type { AiCouple, AiCoupleSource, AiCoupleStatus, AiMessageRecord } from "@/types/ai-couples";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

type SimMsg = { dir?: unknown; text?: unknown; kind?: unknown };

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const b = (await request.json().catch(() => null)) as {
    name?: unknown; weddingDate?: unknown; source?: unknown; status?: unknown; note?: unknown; messages?: SimMsg[];
  } | null;
  if (!b || !Array.isArray(b.messages) || !b.messages.length) return bad("messages zorunlu");
  const now = Date.now();
  const msgs: AiMessageRecord[] = b.messages.slice(-30).map((m, i, arr) => ({
    id: `sim-${i}`,
    at: new Date(now - (arr.length - i) * 60_000).toISOString(),
    channel: "whatsapp",
    direction: m.dir === "out" ? "out" : "in",
    kind: (typeof m.kind === "string" ? m.kind : m.dir === "out" ? "ai" : "reply") as AiMessageRecord["kind"],
    text: String(m.text ?? "").slice(0, 2000),
  }));
  const iso = new Date(now - 3 * 86400_000).toISOString();
  const c: AiCouple = {
    id: "sim",
    name: typeof b.name === "string" && b.name ? b.name : "Deneme Müşteri",
    phone: "905000000000",
    weddingDate: typeof b.weddingDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(b.weddingDate) ? b.weddingDate : undefined,
    source: (typeof b.source === "string" ? b.source : "meta_form") as AiCoupleSource,
    note: typeof b.note === "string" ? b.note.slice(0, 500) : undefined,
    grade: "warm",
    status: (typeof b.status === "string" ? b.status : "info_sent") as AiCoupleStatus,
    contactLocked: false,
    callCount: 0,
    callbackRequested: false,
    calls: [],
    messages: msgs,
    timeline: [],
    createdAt: iso,
    updatedAt: iso,
  };
  const t0 = Date.now();
  const r = await generateWaReply(c);
  return NextResponse.json({ ok: true, ms: Date.now() - t0, ...r });
}
