/**
 * n8n (Verimor arama kayıtları) → çift bizi GERİ ARADI.
 * POST { phone, answered, durationSec?, at?, callId } (Bearer AI anahtarı)
 *  - Cevaplandı (sahibi konuştu): kayda düşer, otomatik 2. arama iptal olur ("zaten konuşuldu").
 *  - Cevapsız: kayda düşer, Telegram uyarısı gider, asistan 10 dk sonra geri arar (arama saatinde; iptal edilebilir).
 * Listede olmayan numara → işlem yok. Aynı callId iki kez işlenmez.
 */
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { displayPhone, normalizePhone } from "@/lib/ai-couples/rules";
import { findCoupleByPhone, mutateCouple } from "@/lib/ai-couples/store";
import { sendTelegramMessage } from "@/lib/lead-notify";

export const dynamic = "force-dynamic";

const CALLBACK_AFTER_MISSED_MS = 10 * 60_000;

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const phone = normalizePhone(str(body.phone, 40));
  const callId = (str(body.callId, 80) ?? "").replace(/[^\w-]/g, "").slice(-24);
  if (!phone || !callId) return bad("phone ve callId zorunlu");
  const answered = body.answered === true;
  const dur = Math.max(0, Math.round(Number(body.durationSec) || 0));
  const now = new Date();
  const atMs = typeof body.at === "string" ? Date.parse(body.at) : NaN;
  const at = Number.isFinite(atMs) && atMs <= now.getTime() ? new Date(atMs) : now;
  if (now.getTime() - at.getTime() > 24 * 3600_000) return NextResponse.json({ ok: true, skipped: "eski kayıt" });

  const couple = await findCoupleByPhone(phone);
  if (!couple) return NextResponse.json({ ok: true, matched: false });

  const mark = `#in-${callId}`;
  let duplicate = false;
  let scheduled = false;
  const updated = await mutateCouple(couple.id, (c) => {
    if (c.timeline.some((e) => e.text.endsWith(mark))) {
      duplicate = true;
      return c;
    }
    const iso = at.toISOString();
    if (answered) {
      return {
        ...c,
        inboundAt: iso,
        // Sahibi telefonda konuştu → henüz aranmamış çift otomatik aranmasın
        status: c.status === "new" ? "contacted" : c.status,
        callbackRequested: (c.busyRetries ?? 0) > 0 ? false : c.callbackRequested,
        busyRetries: 0,
        timeline: [...c.timeline, { at: iso, type: "inbound", text: `📞 Bizi geri aradı — telefonda görüşüldü (${Math.floor(dur / 60)} dk ${dur % 60} sn) ${mark}` }],
        updatedAt: now.toISOString(),
      };
    }
    const canCall = !c.contactLocked && !c.callsPaused && c.status !== "won" && c.status !== "lost";
    scheduled = canCall;
    return {
      ...c,
      ...(canCall ? { callbackRequested: true, callbackAt: new Date(now.getTime() + CALLBACK_AFTER_MISSED_MS).toISOString() } : {}),
      timeline: [
        ...c.timeline,
        { at: iso, type: "inbound_missed", text: `📵 Bizi geri aradı — AÇILMADI${canCall ? " → asistan 10 dk içinde geri arayacak" : ""} ${mark}` },
      ],
      updatedAt: now.toISOString(),
    };
  });
  if (duplicate || !updated) return NextResponse.json({ ok: true, duplicate });

  if (!answered) {
    await sendTelegramMessage(
      `📵 GERİ ARADI, AÇILMADI: ${updated.name} — ${displayPhone(updated.phone)}${updated.weddingDate ? ` · Düğün: ${updated.weddingDate.split("-").reverse().join(".")}` : ""}\n${
        scheduled ? "Asistan 10 dakika içinde geri arayacak. Kendiniz aramak isterseniz panelden \"Aramayı iptal et\" deyin." : "Otomatik arama kapalı — siz dönün."
      }`
    ).catch(() => false);
  }
  return NextResponse.json({ ok: true, matched: true, answered, scheduled });
}
