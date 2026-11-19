/**
 * Sesli asistan (Retell/Vapi → n8n): arama sonucunu kaydet.
 * POST { outcome, summary?, transcript?, recordingUrl?, durationSec?, provider?, externalId?, quotedRemaining? }
 * "booked_elsewhere" / "do_not_contact" → çift otomatik KARA LİSTE.
 */
import { randomUUID } from "crypto";
import { NextResponse } from "next/server";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { bad, readJson, str } from "@/lib/ai-couples/http";
import { applyCallOutcome, BUSY_MAX_RETRIES, BUSY_RETRY_MS, displayPhone, OUTCOME_LABEL } from "@/lib/ai-couples/rules";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { mutateCouple } from "@/lib/ai-couples/store";
import { checkDate } from "@/lib/ai-couples/capacity";
import { parseCallbackTime } from "@/lib/ai-couples/callback-time";
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
    notes: (() => {
      const n = body.notes && typeof body.notes === "object" ? (body.notes as Record<string, unknown>) : null;
      if (!n) return undefined;
      const out = {
        paket: str(n.paket, 120),
        ekstralar: str(n.ekstralar, 400),
        cekimTuru: str(n.cekimTuru, 200),
        itiraz: str(n.itiraz, 400),
        tarihTut: n.tarihTut === true || n.tarihTut === "true" ? true : undefined,
      };
      return Object.values(out).some((v) => v !== undefined) ? out : undefined;
    })(),
  };

  // Görüşmede öğrenilen düğün tarihi (YYYY-MM-DD) — kayıtta tarih yoksa yazılır.
  const learnedDate = str(body.weddingDate, 10);
  const weddingDate = learnedDate && /^\d{4}-\d{2}-\d{2}$/.test(learnedDate) && !Number.isNaN(Date.parse(learnedDate))
    ? learnedDate
    : undefined;
  const coupleId = (await params).id;

  // HAT MEŞGUL: arama sayılmaz, 5 dk sonra tekrar denenir (en fazla 2 kez); sonra normal "açmadı" akışı
  if (body.busy === true && outcome === "no_answer") {
    let retried = 0;
    let handled = false;
    const busyUpdated = await mutateCouple(coupleId, (c) => {
      const tries = c.busyRetries ?? 0;
      // Aynı webhook ikinci kez geldiyse (meşgul kaydı ya da arama olarak zaten işlendi) HİÇBİR ŞEY değiştirme
      if (
        record.externalId &&
        (c.timeline.some((e) => e.type === "busy" && e.text.endsWith(`#${record.externalId!.slice(-6)}`)) ||
          c.calls.some((x) => x.externalId === record.externalId))
      ) {
        handled = true;
        retried = tries;
        return c;
      }
      if (c.contactLocked || tries >= BUSY_MAX_RETRIES) return c;
      handled = true;
      retried = tries + 1;
      return {
        ...c,
        busyRetries: retried,
        callbackRequested: true,
        callbackAt: new Date(now.getTime() + BUSY_RETRY_MS).toISOString(),
        updatedAt: record.at,
        timeline: [
          ...c.timeline,
          { at: record.at, type: "busy", text: `Hat meşgul — 5 dk sonra tekrar aranacak (${retried}/${BUSY_MAX_RETRIES}) #${(record.externalId ?? "").slice(-6)}` },
        ],
      };
    });
    if (!busyUpdated) return bad("Bulunamadı", 404);
    if (handled) {
      await sendTelegramMessage(
        `📵 Hat meşgul: ${busyUpdated.name} — ${displayPhone(busyUpdated.phone)}\nKapatıldı, 5 dk sonra tekrar aranacak (${retried}/${BUSY_MAX_RETRIES}).`
      ).catch(() => false);
      return NextResponse.json({ ok: true, busy: true, retry: retried, couple: busyUpdated });
    }
    record.summary = [record.summary, `Hat ${BUSY_MAX_RETRIES + 1} kez meşgul çıktı.`].filter(Boolean).join("\n");
  }

  let duplicate = false;
  const updated = await mutateCouple(coupleId, (c) => {
    // Aynı arama iki kez gelirse (webhook tekrarı) ikinci kez sayma.
    if (record.externalId && c.calls.some((x) => x.externalId === record.externalId)) {
      duplicate = true;
      return c;
    }
    const withCall = { ...c, calls: [...c.calls, record], weddingDate: c.weddingDate ?? weddingDate };
    // Kilitli çift aranmışsa (olmamalı) kayıt tutulur ama kilit bozulmaz.
    if (c.contactLocked) {
      return {
        ...withCall,
        updatedAt: record.at,
        timeline: [...c.timeline, { at: record.at, type: "violation", text: "UYARI: kara listedeki çift arandı" }],
      };
    }
    const after = applyCallOutcome(withCall, outcome, now, record.quotedRemaining);
    if (outcome !== "callback_requested") return after;
    // Çiftin söylediği zaman: önce sözlü ifade ("yarın 15:00", "akşam"), sonra dakika; ikisi de yoksa kural: 2 saat sonra
    const said = parseCallbackTime(str(body.callbackText, 120), now);
    const inMin = Number(body.callbackInMin);
    const when = said
      ? said
      : Number.isFinite(inMin) && inMin > 0
        ? new Date(now.getTime() + Math.min(Math.max(inMin, 5), 3 * 24 * 60) * 60_000)
        : null;
    if (!when) return after;
    const bounded = new Date(Math.min(Math.max(when.getTime(), now.getTime() + 5 * 60_000), now.getTime() + 14 * 86_400_000));
    const label = bounded.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
    return {
      ...after,
      callbackAt: bounded.toISOString(),
      timeline: [...after.timeline, { at: record.at, type: "callback", text: `Tekrar arama zamanı: ${label}${str(body.callbackText, 120) ? ` (çift: "${str(body.callbackText, 120)}")` : ""}` }],
    };
  });
  if (!updated) return bad("Bulunamadı", 404);

  // Sahibine Telegram: görüşme özeti + takvime göre tarih durumu (açmadıysa bildirme).
  if (!duplicate && outcome !== "no_answer") {
    const date = updated.weddingDate
      ? new Date(`${updated.weddingDate}T12:00:00`).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric", weekday: "long" })
      : "tarih öğrenilemedi";
    const day = updated.weddingDate ? await checkDate(updated.weddingDate).catch(() => null) : null;
    const lines = [
      `📞 ${updated.name} — ${displayPhone(updated.phone)}`,
      `Sonuç: ${OUTCOME_LABEL[outcome]}${updated.contactLocked ? " (🔒 kara liste)" : ""}`,
      `Düğün tarihi: ${date}`,
      record.summary ? `Özet: ${record.summary}` : "",
      !updated.contactLocked && day ? `\n📅 Takvim: ${day.available ? "✅" : "⛔"} ${day.cevap}` : "",
    ].filter(Boolean);
    await sendTelegramMessage(lines.join("\n")).catch(() => false);
  } else if (!duplicate && outcome === "no_answer") {
    const n = updated.calls.length;
    const next = n <= 1
      ? "Şimdi WhatsApp'tan \"aradık, ulaşamadık\" mesajı gidiyor. WhatsApp'a da dönmezse yaklaşık 2 saat sonra 2. (son) arama yapılacak."
      : "Son WhatsApp mesajı (kampanya bitiyor, yerler doluyor) gönderilecek. Bir daha aranmayacak.";
    await sendTelegramMessage(`📵 Ulaşılamadı (${n}. arama): ${updated.name} — ${displayPhone(updated.phone)}\n${next}`).catch(() => false);
  }

  return NextResponse.json({
    ok: true,
    couple: updated,
    next: {
      sendCatalog: outcome === "info_requested" && !updated.contactLocked,
      locked: updated.contactLocked,
    },
  });
}
