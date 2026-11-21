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
import { cleanName, getCouple, mutateCouple } from "@/lib/ai-couples/store";
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
    // İsim düzeltme (süslü yazı tipi / yanlış yazım)
    const newName = cleanName(str(body.name, 120));
    if (newName && newName !== next.name) next = { ...next, name: newName, timeline: [...next.timeline, { at: now.toISOString(), type: "edit", text: `İsim düzeltildi: ${next.name} → ${newName}` }], updatedAt: now.toISOString() };
    // Test kaydı işareti: sayılara girmez, otomatik aranmaz / yazılmaz
    if (typeof body.markTest === "boolean") {
      next = body.markTest
        ? { ...next, sourceRef: "test", callbackRequested: false, callbackAt: undefined, followUpAt: undefined, timeline: [...next.timeline, { at: now.toISOString(), type: "edit", text: "🧪 Test kaydı olarak işaretlendi — istatistiğe sayılmaz, otomatik aranmaz" }] }
        : { ...next, sourceRef: next.sourceRef === "test" ? undefined : next.sourceRef, timeline: [...next.timeline, { at: now.toISOString(), type: "edit", text: "Test işareti kaldırıldı — gerçek çift olarak sayılır" }] };
    }
    const leadAt = str(body.leadAt, 40);
    if (leadAt && !Number.isNaN(Date.parse(leadAt)) && Date.parse(leadAt) <= now.getTime()) next = { ...next, leadAt: new Date(leadAt).toISOString() };
    // Yanlış sınıflanan aramayı düzelt: { fixCall: { externalId, summary? } } → "açtı ama dinlemeden kapattı" (no_answer)
    const fx = body.fixCall as { externalId?: unknown; summary?: unknown } | undefined;
    const fxId = fx && typeof fx.externalId === "string" ? fx.externalId : "";
    if (fxId && next.calls.some((x) => x.externalId === fxId) && !next.contactLocked) {
      const sum = typeof fx?.summary === "string" ? fx.summary.slice(0, 300) : "Açtı ama tanıtımı dinlemeden kapattı — konuşulmadı.";
      const wasThinking = next.status === "thinking";
      next = {
        ...next,
        calls: next.calls.map((x) => (x.externalId === fxId ? { ...x, outcome: "no_answer" as const, summary: sum } : x)),
        status: wasThinking ? "contacted" : next.status,
        grade: wasThinking ? "cold" : next.grade,
        followUpAt: wasThinking ? undefined : next.followUpAt,
        timeline: [...next.timeline.filter((e) => !(wasThinking && e.type === "thinking")), { at: now.toISOString(), type: "edit", text: `Arama sonucu düzeltildi: ${sum}` }],
        updatedAt: now.toISOString(),
      };
    }
    return next;
  });
  if (!updated) return bad("Bulunamadı", 404);
  return NextResponse.json({ ok: true, couple: updated });
}
