/**
 * WhatsApp / SMS mesaj kaydı.
 *
 * GİDEN (direction:"out"): n8n mesajı GÖNDERMEDEN ÖNCE buraya yazar.
 *   - İzin yoksa 423 döner → n8n mesajı göndermez (kara liste, saat dışı…).
 *   - İzin varsa kayıt düşülür → n8n gönderir.
 * GELEN (direction:"in"): çiftin cevabı. `intent` gönderilmezse metinden tahmin edilir:
 *   stop / booked_elsewhere → KARA LİSTE, thinking → Ilık + 7 gün takip.
 */
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import {
  canContact,
  detectInboundIntent,
  lockCouple,
  markThinking,
  type InboundIntent,
} from "@/lib/ai-couples/rules";
import { getCouple, mutateCouple } from "@/lib/ai-couples/store";
import type { AiMessageChannel, AiMessageRecord } from "@/types/ai-couples";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const CHANNELS: AiMessageChannel[] = ["whatsapp", "sms", "dugun_com", "telegram"];
const KINDS = ["welcome", "catalog", "follow_up", "reply", "other"] as const;
const INTENTS: InboundIntent[] = ["stop", "booked_elsewhere", "thinking", "interested", "unknown"];

export async function POST(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const id = (await params).id;
  const channel = (str(body.channel) ?? "whatsapp") as AiMessageChannel;
  if (!CHANNELS.includes(channel)) return bad("Geçersiz channel");
  const direction = str(body.direction) === "in" ? "in" : "out";
  const kindRaw = str(body.kind);
  const kind = (KINDS as readonly string[]).includes(kindRaw ?? "") ? (kindRaw as AiMessageRecord["kind"]) : "other";
  const text = str(body.text, 4000);
  if (!text) return bad("text zorunlu");
  const now = new Date();

  const existing = await getCouple(id);
  if (!existing) return bad("Bulunamadı", 404);

  if (direction === "out") {
    // Düğün.com panel mesajı çiftin kendi talebine cevaptır; saat kuralı yine geçerli.
    const decision = canContact(existing, channel === "sms" ? "sms" : "whatsapp", now);
    if (!decision.allowed) {
      return NextResponse.json({ ok: false, allowed: false, reason: decision.reason }, { status: 423 });
    }
    if (kind === "follow_up" && existing.followUpSentAt) {
      return NextResponse.json({ ok: false, allowed: false, reason: "Takip mesajı zaten gönderildi" }, { status: 423 });
    }
  }

  const msg: AiMessageRecord = { id: randomUUID(), at: now.toISOString(), channel, direction, kind, text };
  const intentRaw = str(body.intent) as InboundIntent | undefined;
  const intent: InboundIntent =
    direction === "in" ? (intentRaw && INTENTS.includes(intentRaw) ? intentRaw : detectInboundIntent(text)) : "unknown";

  const updated = await mutateCouple(id, (c) => {
    let next = { ...c, messages: [...c.messages, msg], updatedAt: msg.at };
    if (direction === "out") {
      if (kind === "follow_up") next.followUpSentAt = msg.at;
      if (kind === "catalog" && (next.status === "new" || next.status === "contacted")) next.status = "info_sent";
      if (next.status === "new") next.status = "contacted";
      return next;
    }
    // gelen mesaj
    if (intent === "stop") return lockCouple(next, "Mesajla iletişim istemediğini söyledi", now);
    if (intent === "booked_elsewhere") return lockCouple(next, "Başka fotoğrafçıyla anlaştı (mesaj)", now);
    if (intent === "thinking") next = markThinking(next, now, "WhatsApp: düşüneceğini söyledi");
    if (intent === "interested" && !next.contactLocked) {
      next = { ...next, grade: "hot", followUpAt: next.followUpSentAt ? next.followUpAt : undefined };
    }
    return next;
  });

  return NextResponse.json({ ok: true, allowed: true, intent, couple: updated });
}
