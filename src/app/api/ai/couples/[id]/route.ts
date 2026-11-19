/**
 * n8n: tek çift oku / durum güncelle.
 * PATCH { event?: "thinking" | "no_reply" | "offer_requested" | "won" | "do_not_contact" | "booked_elsewhere",
 *         grade?: "hot"|"warm"|"cold"|"blacklist", note?: string }
 * Kara liste kilidi API ile AÇILAMAZ (yalnızca admin panel).
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { AI_EVENTS, applyEvent, lockCouple, type AiEvent } from "@/lib/ai-couples/rules";
import { getCouple, mutateCouple } from "@/lib/ai-couples/store";
import type { AiCoupleGrade } from "@/types/ai-couples";
import { selamFor } from "@/lib/ai-couples/hitap";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const couple = await getCouple((await params).id);
  if (!couple) return bad("Bulunamadı", 404);
  // selam: sesli asistanın açılışı ("Merhabalar Ayşe Hanım") — panelden "Şimdi ara" (n8n P2) kullanır
  return NextResponse.json({ ok: true, couple: { ...couple, selam: selamFor(couple.name) } });
}

export async function PATCH(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const ev = str(body.event) as AiEvent | undefined;
  if (ev && !AI_EVENTS.includes(ev)) return bad(`event şunlardan biri olmalı: ${AI_EVENTS.join(", ")}`);
  const grade = str(body.grade) as AiCoupleGrade | undefined;
  if (grade && !["hot", "warm", "cold", "blacklist"].includes(grade)) return bad("Geçersiz grade");
  const note = str(body.note, 1000);
  const now = new Date();

  const updated = await mutateCouple((await params).id, (c) => {
    let next = c;
    if (ev) next = applyEvent(next, ev, now);
    if (grade === "blacklist") next = lockCouple(next, str(body.reason, 200) ?? "n8n tarafından kara listeye alındı", now);
    else if (grade && !next.contactLocked) next = { ...next, grade, updatedAt: now.toISOString() };
    if (note) next = { ...next, note, updatedAt: now.toISOString() };
    return next;
  });
  if (!updated) return bad("Bulunamadı", 404);
  return NextResponse.json({ ok: true, couple: updated });
}
