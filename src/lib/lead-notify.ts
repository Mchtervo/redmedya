import { formatWeddingDateDisplay } from "@/lib/date-format";
import { reloadPersistentEnv } from "@/lib/data-dir";
import { leadPackageLabel, leadPlatoLabel, leadSourceLabel } from "@/lib/lead-display";
import { formatPrice } from "@/lib/utils";
import type { LeadRecord } from "@/types/site-settings";

const TELEGRAM_TIMEOUT_MS = 8_000;
const EMAIL_TIMEOUT_MS = 8_000;

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

export function buildLeadNotifyText(lead: LeadRecord): string {
  const name =
    [lead.customer.firstName, lead.customer.lastName]
      .filter((p) => p.trim())
      .join(" ")
      .trim() || "—";
  const date = lead.customer.weddingDate
    ? formatWeddingDateDisplay(lead.customer.weddingDate) || lead.customer.weddingDate
    : "—";
  return [
    "Yeni lead — REDMEDYA",
    `Paket: ${leadPackageLabel(lead)}`,
    `Plato: ${leadPlatoLabel(lead)}`,
    `Toplam: ${formatPrice(lead.cart.total)}`,
    `İsim: ${name}`,
    `Telefon: ${lead.customer.phone}`,
    `Tarih: ${date}`,
    `Kaynak: ${leadSourceLabel(lead.source)}`,
  ].join("\n");
}

async function sendTelegram(text: string): Promise<void> {
  const loaded = reloadPersistentEnv();
  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
  console.log("[lead-notify] telegram env", {
    dataDir: loaded.dataDir,
    telegramEnvExists: loaded.telegramEnvExists,
    tokenSet: Boolean(token),
    chatIdSet: Boolean(chatId),
  });
  if (!token || !chatId) {
    console.error("[lead-notify] telegram atlandi: token veya chat_id bos");
    return;
  }
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
  });
  const raw = (await res.text()).slice(0, 240);
  if (!res.ok) {
    console.error("[lead-notify] telegram http", { status: res.status, body: raw });
    throw new Error(`telegram_http_${res.status}`);
  }
  console.log("[lead-notify] telegram ok", { status: res.status });
}

async function sendResendEmail(text: string): Promise<void> {
  const apiKey = env("RESEND_API_KEY");
  const to = env("LEAD_NOTIFY_EMAIL");
  if (!apiKey || !to) return;
  const from =
    env("LEAD_NOTIFY_FROM") || "REDMEDYA <noreply@redmediadugun.com>";
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Yeni lead — REDMEDYA",
      text,
    }),
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error("email_failed");
  }
}

async function sendWebhook(lead: LeadRecord, text: string): Promise<void> {
  const url = env("LEAD_NOTIFY_WEBHOOK_URL");
  if (!url) return;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event: "new_lead",
      text,
      leadId: lead.id,
      source: lead.source,
      total: lead.cart.total,
    }),
    signal: AbortSignal.timeout(EMAIL_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error("webhook_failed");
  }
}

/**
 * Yeni lead kaydından sonra Telegram / e-posta / webhook.
 * Telefon ve isim loglara yazılmaz.
 */
export async function notifyNewLead(lead: LeadRecord): Promise<void> {
  console.log("[lead-notify] cagrildi", { leadId: lead.id });
  const text = buildLeadNotifyText(lead);
  const results = await Promise.allSettled([
    sendTelegram(text),
    sendResendEmail(text),
    sendWebhook(lead, text),
  ]);
  const telegram = results[0];
  if (telegram.status === "rejected") {
    const reason = telegram.reason;
    console.error("[lead-notify] telegram rejected", {
      leadId: lead.id,
      message: reason instanceof Error ? reason.message : "unknown",
    });
  }
}
