/**
 * n8n / sesli asistan / Telegram API anahtarı.
 * AI_API_TOKEN env varsa o; yoksa DATA_DIR/ai-api.secret üretilir (deploy'da kalır).
 * İstek: Authorization: Bearer <token>
 */
import { createHash, randomBytes, timingSafeEqual } from "crypto";
import { readFileSync, writeFileSync } from "fs";
import { NextResponse } from "next/server";
import { dataPath, reloadPersistentEnv } from "@/lib/data-dir";

export function getAiApiToken(): string {
  reloadPersistentEnv();
  const fromEnv = process.env.AI_API_TOKEN?.trim() ?? "";
  if (fromEnv.length >= 24) return fromEnv;
  const file = dataPath("ai-api.secret");
  try {
    const t = readFileSync(file, "utf8").trim();
    if (t.length >= 24) return t;
  } catch {
    /* yok */
  }
  const generated = randomBytes(32).toString("hex");
  try {
    writeFileSync(file, `${generated}\n`, { encoding: "utf8", mode: 0o600 });
  } catch {
    console.error("[ai-api] ai-api.secret yazilamadi");
  }
  return generated;
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function verifyAiApiRequest(request: Request): boolean {
  const hdr = request.headers.get("authorization") ?? "";
  const token = hdr.toLowerCase().startsWith("bearer ") ? hdr.slice(7).trim() : "";
  if (!token) return false;
  return safeEqual(token, getAiApiToken());
}

export function requireAiApi(request: Request): NextResponse | null {
  if (verifyAiApiRequest(request)) return null;
  return NextResponse.json({ ok: false, error: "Yetkisiz" }, { status: 401 });
}

/** Telegram webhook gizli başlığı (X-Telegram-Bot-Api-Secret-Token) — tokenden türetilir. */
export function getTelegramWebhookSecret(): string {
  return createHash("sha256").update(`tg:${getAiApiToken()}`).digest("hex").slice(0, 48);
}

export function verifyTelegramSecret(request: Request): boolean {
  const got = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  return Boolean(got) && safeEqual(got, getTelegramWebhookSecret());
}
