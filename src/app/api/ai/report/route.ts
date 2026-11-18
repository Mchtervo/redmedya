/**
 * Günlük rapor. GET → { data, text }  ·  POST → Telegram'a gönder (günde 1; ?force=1 tekrar).
 * n8n her akşam 21:00'de POST eder.
 */
import { readFile, writeFile } from "fs/promises";
import { NextResponse } from "next/server";
import { dataPath } from "@/lib/data-dir";
import { requireAiApi } from "@/lib/ai-couples/auth";
import { buildDailyReport } from "@/lib/ai-couples/report";
import { sendTelegramMessage } from "@/lib/lead-notify";

export const dynamic = "force-dynamic";
const SENT_FILE = dataPath("ai-report-sent.txt");

export async function GET(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  return NextResponse.json({ ok: true, ...(await buildDailyReport()) });
}

export async function POST(request: Request) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const force = new URL(request.url).searchParams.get("force") === "1";
  const report = await buildDailyReport();
  let last = "";
  try {
    last = (await readFile(SENT_FILE, "utf-8")).trim();
  } catch {
    /* ilk */
  }
  if (!force && last === report.data.day) {
    return NextResponse.json({ ok: true, sent: false, reason: "Bugün zaten gönderildi" });
  }
  const sent = await sendTelegramMessage(report.text);
  if (sent) await writeFile(SENT_FILE, report.data.day, "utf-8");
  return NextResponse.json({ ok: sent, sent }, { status: sent ? 200 : 502 });
}
