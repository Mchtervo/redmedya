import { formatWeddingDateDisplay } from "@/lib/date-format";
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
  const token = env("TELEGRAM_BOT_TOKEN");
  const chatId = env("TELEGRAM_CHAT_ID");
  if (!token || !chatId) return;
  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    signal: AbortSignal.timeout(TELEGRAM_TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error("telegram_failed");
  }
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
 * Lead HTTP yanıtını bloklamaz; hata olursa sessizce geçer.
 * Telefon ve isim loglara yazılmaz.
 */
export async function notifyNewLead(lead: LeadRecord): Promise<void> {
  const text = buildLeadNotifyText(lead);
  const results = await Promise.allSettled([
    sendTelegram(text),
    sendResendEmail(text),
    sendWebhook(lead, text),
  ]);
  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0 && results.every((r) => r.status === "rejected")) {
    console.error("[lead-notify] kanallar başarısız", { leadId: lead.id });
  }
}
