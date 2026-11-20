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
  displayPhone,
  type InboundIntent,
} from "@/lib/ai-couples/rules";
import { sendTelegramMessage } from "@/lib/lead-notify";
import { getCouple, mutateCouple } from "@/lib/ai-couples/store";
import { parseCallbackTime } from "@/lib/ai-couples/callback-time";
import type { AiCouple, AiMessageChannel, AiMessageRecord } from "@/types/ai-couples";

export const dynamic = "force-dynamic";
type Ctx = { params: Promise<{ id: string }> };

const CHANNELS: AiMessageChannel[] = ["whatsapp", "sms", "dugun_com", "telegram"];
const KINDS = ["welcome", "catalog", "follow_up", "reply", "other", "ai"] as const;
const INTENTS: InboundIntent[] = ["stop", "booked_elsewhere", "not_interested", "thinking", "interested", "unknown"];

export async function POST(request: Request, { params }: Ctx) {
  const denied = requireAiApi(request);
  if (denied) return denied;
  const body = await readJson(request);
  if (!body) return bad("Geçersiz JSON");
  const id = (await params).id;
  const channel = (str(body.channel) ?? "whatsapp") as AiMessageChannel;
  if (!CHANNELS.includes(channel)) return bad("Geçersiz channel");
  const direction = str(body.direction) === "in" ? "in" : "out";
  // Sahibinin TELEFONDAN yazdığı mesaj (n8n C, WhatsApp "fromMe"): zaten gitti → izin sorulmaz, sadece kayda düşer
  const fromPhone = body.fromPhone === true && direction === "out";
  const kindRaw = str(body.kind);
  const kind = fromPhone ? "reply" : (KINDS as readonly string[]).includes(kindRaw ?? "") ? (kindRaw as AiMessageRecord["kind"]) : "other";
  const text = str(body.text, 4000);
  if (!text) return bad("text zorunlu");
  const now = new Date();

  const existing = await getCouple(id);
  if (!existing) return bad("Bulunamadı", 404);

  // Giden mesaj izni. Panelden personelin elle yazdığı cevap (kind "reply"): saat kuralı yok, kara liste kuralı var.
  // Düğün.com karşılaması (SMS / platform mesajı) gece de gidebilir — numara ancak SMS'le açılıyor, 1 saat içinde dönüş kuralı.
  const decide = (c: AiCouple): { allowed: true } | { allowed: false; reason: string } => {
    const d =
      kind === "reply" || (kind === "welcome" && (channel === "dugun_com" || channel === "sms")) ||
      // Yapay zekânın müşteriye cevabı (müşteri yazdı → her saatte cevap verilebilir; iptal/kayıp/rezervasyon hariç)
      (kind === "ai" && !c.messagesPaused && !c.contactLocked && c.status !== "won" && c.status !== "lost") ||
      // Yeni talebe ilk karşılama WhatsApp'ı (gece gelen form): henüz aranmamış ve hiç yazılmamışsa saat kuralı yok
      (kind === "welcome" && channel === "whatsapp" && !c.messagesPaused && !c.contactLocked && c.status !== "won" && c.status !== "lost")
        ? c.contactLocked
          ? { allowed: false as const, reason: "Kara liste — iletişim kapalı" }
          : { allowed: true as const }
        : canContact(c, channel === "sms" ? "sms" : "whatsapp", now);
    if (!d.allowed) return d;
    if (kind === "follow_up" && c.followUpSentAt) return { allowed: false, reason: "Takip mesajı zaten gönderildi" };
    return { allowed: true };
  };
  if (direction === "out" && !fromPhone) {
    const pre = decide(existing);
    if (!pre.allowed) return NextResponse.json({ ok: false, allowed: false, reason: pre.reason }, { status: 423 });
  }
  let blockedReason: string | null = null;
  let duplicate = false;
  const norm = (t: string) => t.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");

  // Telefondan yazılan mesaj geriye dönük işlenirken asıl saati korunur (en fazla 7 gün geriye)
  const atMs = fromPhone && typeof body.at === "string" ? Date.parse(body.at) : NaN;
  const at = Number.isFinite(atMs) && atMs <= now.getTime() && now.getTime() - atMs < 7 * 86_400_000 ? new Date(atMs) : now;
  const msg: AiMessageRecord = { id: randomUUID(), at: at.toISOString(), channel, direction, kind, text, ...(kind === "ai" && body.handoff === true ? { handoff: true } : {}) };
  const intentRaw = str(body.intent) as InboundIntent | undefined;
  const intent: InboundIntent =
    direction === "in" ? (intentRaw && INTENTS.includes(intentRaw) ? intentRaw : detectInboundIntent(text)) : "unknown";

  const updated = await mutateCouple(id, (c) => {
    if (fromPhone) {
      // Otomasyonun kendi gönderdiği mesaj da WhatsApp'tan "fromMe" döner → aynısı son 30 dk'da kayıtlıysa tekrar yazma
      const recent = c.messages.filter((m) => m.direction === "out" && Math.abs(at.getTime() - Date.parse(m.at)) < 30 * 60_000);
      const media = text.startsWith("[");
      const t = norm(text);
      if (recent.some((m) => norm(m.text) === t || (media && m.text.startsWith("[")) || (t.length >= 40 && norm(m.text).includes(t.slice(0, 80))))) {
        duplicate = true;
        return c;
      }
    } else if (direction === "out") {
      // Son karar kilit altında, en güncel kayıtla (o arada "aramayın" gelmiş olabilir)
      const d = decide(c);
      if (!d.allowed) {
        blockedReason = d.reason;
        return c;
      }
    }
    let next = { ...c, messages: [...c.messages, msg].sort((x, y) => x.at.localeCompare(y.at)), updatedAt: now.toISOString() };
    if (direction === "out") {
      if (kind === "follow_up") next.followUpSentAt = msg.at;
      if (kind === "catalog" && (next.status === "new" || next.status === "contacted")) next.status = "info_sent";
      // "Önce arama" kuralı: henüz aranmamış çift, mesaj gitti diye aranacaklar listesinden çıkmaz
      if (next.status === "new" && kind !== "welcome" && next.calls.length) next.status = "contacted";
      return next;
    }
    // gelen mesaj — kara listedeki çiftin kaydı bozulmaz (mesaj sadece kayda düşer)
    if (next.contactLocked) return next;
    // Müşteri yazdıysa artık "yeni talep" değildir (ilk arama gibi aranmasın)
    if (next.status === "new") next = { ...next, status: "contacted" };
    if (intent === "stop") return lockCouple(next, "Mesajla iletişim istemediğini söyledi", now);
    if (intent === "booked_elsewhere") return lockCouple(next, "Başka fotoğrafçıyla anlaştı (mesaj)", now);
    if (intent === "not_interested" && next.status !== "won") {
      return { ...next, grade: "cold", status: "lost", followUpAt: undefined,
        timeline: [...next.timeline, { at: msg.at, type: "lost", text: "WhatsApp: ilgilenmediğini / bütçenin uymadığını söyledi" }] };
    }
    if (intent === "thinking") next = markThinking(next, now, "WhatsApp: düşüneceğini söyledi");
    // "Akşam 7'de arayın / yarın öğlen müsaitim" → aramayı o saate kur (henüz telefonda konuşulmadıysa)
    const wantsCall = /(aray[ıi]n|arayabilir|arars[aı]n[ıi]z|ararsan|m[üu]sait(im|iz)|uygunum|uygunuz|d[öo]n[üu]n|g[öo]r[üu][şs]elim|g[öo]r[üu][şs]ebiliriz)/i.test(text) && !/(tl|lira|fiyat|[üu]cret|\bbin\b|\d{3})/i.test(text);
    const hasMonth = /(^|[\s\d])(ocak|şubat|mart|nisan|mayıs|haziran|temmuz|ağustos|eylül|ekim|kasım|aralık)/i.test(text); // düğün tarihi yazmışsa saat sanma
    const talked = next.calls.some((x) => x.outcome !== "no_answer");
    if (wantsCall && !hasMonth && !talked && !next.callsPaused && intent !== "thinking" && next.status !== "won" && next.status !== "lost") {
      const t = parseCallbackTime(text, now);
      if (t && t.getTime() > now.getTime() + 5 * 60_000 && t.getTime() < now.getTime() + 14 * 86_400_000) {
        const label = t.toLocaleString("tr-TR", { timeZone: "Europe/Istanbul", weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
        next = {
          ...next,
          callbackRequested: true,
          callbackAt: t.toISOString(),
          busyRetries: 0,
          timeline: [...next.timeline, { at: msg.at, type: "callback", text: `Tekrar arama zamanı: ${label} (çift WhatsApp'tan yazdı: "${text.replace(/\s+/g, " ").slice(0, 80)}")` }],
        };
      }
    }
    if (intent === "interested" && !next.contactLocked) {
      next = { ...next, grade: "hot", followUpAt: next.followUpSentAt ? next.followUpAt : undefined };
    }
    return next;
  });

  if (duplicate) return NextResponse.json({ ok: true, duplicate: true });
  if (blockedReason) return NextResponse.json({ ok: false, allowed: false, reason: blockedReason }, { status: 423 });

  // Gelen her cevap Telegram'a (otomatik cevap YOK; sahibi/ekip cevaplar)
  if (direction === "in" && updated) {
    const who = `${updated.name} - ${displayPhone(updated.phone)}${updated.weddingDate ? ` - Düğün: ${updated.weddingDate}` : ""}`;
    const label: Record<InboundIntent, string> = {
      interested: "SICAK", thinking: "ILIK", not_interested: "SOĞUK", booked_elsewhere: "SOĞUK (başka firmayla anlaşmış)",
      stop: "İSTEMİYOR", unknown: "DEĞERLENDİR",
    };
    const tg = intent === "stop"
      ? `İstemiyor: ${who}
Mesajı: ${text}
(Kara listeye alındı, bir daha yazılmayacak.)`
      : `${intent === "interested" ? "ACİL - " : ""}CEVAP: ${who} - ${label[intent]} - Mesajı: ${text}`;
    await sendTelegramMessage(tg).catch(() => false);
  }

  return NextResponse.json({ ok: true, allowed: true, intent, couple: updated });
}
