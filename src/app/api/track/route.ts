import { NextRequest, NextResponse } from "next/server";
import { insertEvents, type TrackedEvent } from "@/lib/track/events-store";

/**
 * §11 — Batch journey event alıcısı.
 * KIRMIZI ÇİZGİ: form alan DEĞERLERİ asla saklanmaz. Sunucu tarafında da
 * savunma amaçlı bilinen PII anahtarları payload'dan temizlenir. IP saklanmaz.
 */
const PII_KEYS = new Set([
  "value",
  "name",
  "firstName",
  "lastName",
  "phone",
  "email",
  "note",
  "date", // tam tarih değil; yalnızca "month" izinli
]);

function sanitizePayload(payload: unknown): Record<string, unknown> {
  if (!payload || typeof payload !== "object") return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload as Record<string, unknown>)) {
    if (PII_KEYS.has(k)) continue; // savunma: PII anahtarlarını at
    if (typeof v === "object" && v !== null) continue; // düz değerler dışını at
    out[k] = v;
  }
  return out;
}

function newId(): string {
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// event_type adı: küçük harf, rakam, alt çizgi (ör. "step3_view").
// Rakam İZİNLİ olmalı yoksa step3_view gibi tipler sessizce reddedilir.
const VALID = /^[a-z0-9_]+$/;

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      session_id?: string;
      utm_source?: string;
      utm_campaign?: string;
      device?: string;
      referrer?: string;
      events?: { event_type?: string; ts?: number; payload?: unknown }[];
    };

    if (!body.session_id || !Array.isArray(body.events) || !body.events.length) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const rows: TrackedEvent[] = body.events
      .filter((e) => e.event_type && VALID.test(e.event_type))
      .slice(0, 50)
      .map((e) => ({
        id: newId(),
        session_id: String(body.session_id).slice(0, 80),
        ts: e.ts ? new Date(e.ts).toISOString() : new Date().toISOString(),
        event_type: e.event_type!,
        payload: sanitizePayload(e.payload),
        utm_source: body.utm_source?.slice(0, 120) ?? null,
        utm_campaign: body.utm_campaign?.slice(0, 120) ?? null,
        device: body.device?.slice(0, 20) ?? null,
        referrer: body.referrer?.slice(0, 200) ?? null,
      }));

    await insertEvents(rows);
    return NextResponse.json({ ok: true, count: rows.length });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
