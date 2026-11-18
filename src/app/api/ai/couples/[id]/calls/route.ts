/**
 * Sesli asistan (Retell/Vapi → n8n): arama sonucunu kaydet.
 * POST { outcome, summary?, transcript?, recordingUrl?, durationSec?, provider?, externalId?, quotedRemaining? }
 * "booked_elsewhere" / "do_not_contact" → çift otomatik KARA LİSTE.
 */
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { applyCallOutcome, OUTCOME_LABEL } from "@/lib/ai-couples/rules";
import { mutateCouple } from "@/lib/ai-couples/store";
import type { AiCallOutcome, AiCallRecord } from "@/types/ai-couples";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const OUTCOMES = Object.keys(OUTCOME_LABEL) as AiCallOutcome[];

export async function POST(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const outcome = str(body.outcome) as AiCallOutcome | undefined;
  if (!outcome || !OUTCOMES.includes(outcome)) {
    return bad(`outcome şunlardan biri olmalı: ${OUTCOMES.join(", ")}`);
  }
  const recordingUrl = str(body.recordingUrl, 1000);
  if (recordingUrl && !/^https:\/\//i.test(recordingUrl)) return bad("recordingUrl https olmalı");
  const quoted = Number(body.quotedRemaining);
  const now = new Date();
  const record: AiCallRecord = {
    id: randomUUID(),
    at: now.toISOString(),
    provider: str(body.provider, 40),
    externalId: str(body.externalId, 200),
    durationSec: Number.isFinite(Number(body.durationSec)) ? Math.max(0, Math.round(Number(body.durationSec))) : undefined,
    recordingUrl,
    summary: str(body.summary, 4000),
    transcript: str(body.transcript, 30000),
    outcome,
    quotedRemaining: Number.isFinite(quoted) && quoted >= 0 ? Math.round(quoted) : undefined,
  };

  const updated = await mutateCouple((await params).id, (c) => {
    // Aynı arama iki kez gelirse (webhook tekrarı) ikinci kez sayma.
    if (record.externalId && c.calls.some((x) => x.externalId === record.externalId)) return c;
    const withCall = { ...c, calls: [...c.calls, record] };
    // Kilitli çift aranmışsa (olmamalı) kayıt tutulur ama kilit bozulmaz.
    if (c.contactLocked) {
      return {
        ...withCall,
        updatedAt: record.at,
        timeline: [...c.timeline, { at: record.at, type: "violation", text: "UYARI: kara listedeki çift arandı" }],
      };
    }
    return applyCallOutcome(withCall, outcome, now, record.quotedRemaining);
  });
  if (!updated) return bad("Bulunamadı", 404);
  return NextResponse.json({
    ok: true,
    couple: updated,
    next: {
      sendCatalog: outcome === "info_requested" && !updated.contactLocked,
      locked: updated.contactLocked,
    },
  });
}
