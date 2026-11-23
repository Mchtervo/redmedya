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
import { onOwnerReply } from "@/lib/ai-couples/wa-learning";
import { isWaManual, readAutomation } from "@/lib/ai-couples/automation";
import { forwardManual } from "@/lib/ai-couples/wa-manual";
import { describeWaMedia, type WaMediaMeta } from "@/lib/ai-couples/wa-media";
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
  const text0 = str(body.text, 4000);
  if (!text0) return bad("text zorunlu");
  const waId = str(body.waId, 80);
  // Kaçan mesajların sonradan toplanması (wa-reconcile): asıl saatiyle yazılır, tek tek Telegram bildirimi gitmez
  const backfill = body.backfill === true;
  const mediaRaw = body.media && typeof body.media === "object" ? (body.media as Record<string, unknown>) : null;
  const media: WaMediaMeta | null = mediaRaw && (mediaRaw.kind === "document" || mediaRaw.kind === "image")
    ? { kind: mediaRaw.kind, fileName: str(mediaRaw.fileName, 160), mime: str(mediaRaw.mime, 80), size: Number(mediaRaw.size) > 0 ? Number(mediaRaw.size) : undefined }
    : null;
  const now = new Date();

  const existing = await getCouple(id);
  if (!existing) return bad("Bulunamadı", 404);

  // Sahibi WhatsApp'ta mesajını herkesten sildi → son 48 saatteki son giden mesaj "geri çekildi" (asistan onu gitmiş saymaz)
  if (fromPhone && text0 === "__GERI_CEKILDI__") {
    let marked = "";
    await mutateCouple(id, (c) => {
      const idx = [...c.messages].map((m, i) => ({ m, i })).reverse().find(({ m }) => m.direction === "out" && !m.text.startsWith("[GERİ ÇEKİLDİ]") && Date.now() - Date.parse(m.at) < 48 * 3600_000)?.i;
      if (idx === undefined) return c;
      marked = c.messages[idx].text.slice(0, 80);
      const messages = c.messages.map((m, i) => (i === idx ? { ...m, text: `[GERİ ÇEKİLDİ] ${m.text}` } : m));
      return { ...c, messages, timeline: [...c.timeline, { at: new Date().toISOString(), type: "edit", text: `WhatsApp'ta mesaj geri çekildi: "${marked}"` }], updatedAt: new Date().toISOString() };
    });
    return NextResponse.json({ ok: true, retracted: Boolean(marked) });
  }

  // Aynı WhatsApp mesajı ikinci kez gelirse (webhook tekrarı / toplama işi) yazma
  if (waId && existing.messages.some((m) => m.waId === waId)) return NextResponse.json({ ok: true, duplicate: true });
  // Belge (PDF) / fotoğraf: içeriğini oku, metne ekle → asistan "ne gönderildiğini" bilir.
  // Otomasyonun az önce gönderdiği PDF'in yankısıysa okumaya gerek yok (aşağıda zaten "tekrar" sayılacak).
  let text = text0;
  if (media && waId) {
    const echo = fromPhone && existing.messages.some((m) => m.direction === "out" && /^\[(PDF|belge|fotoğraf|video)/.test(m.text) && Math.abs(Date.now() - Date.parse(m.at)) < 30 * 60_000);
    if (!echo && !/fiyat[-_ ]?listesi/i.test(text0)) {
      const sum = await describeWaMedia(waId, media, fromPhone).catch(() => null);
      if (sum) text = `${text0} — İÇERİK: ${sum}`.slice(0, 4000);
    }
  }

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
  if (direction === "out" && !fromPhone && isWaManual(await readAutomation()) && channel === "whatsapp") {
    // Kampanya (soğuk liste) bu sürede tamamen durur; diğerleri sahibine kopyala-gönder olarak gider
    if (existing.sourceRef === "kampanya-2027" && !existing.messages.some((m) => m.direction === "in")) {
      return NextResponse.json({ ok: false, allowed: false, reason: "WhatsApp manuel mod — kampanya durduruldu" }, { status: 423 });
    }
    const pre = decide(existing);
    if (!pre.allowed) return NextResponse.json({ ok: false, allowed: false, reason: pre.reason }, { status: 423 });
    const fresh = await forwardManual(existing, text, kind ?? "other");
    return NextResponse.json({ ok: false, allowed: false, manual: true, reason: fresh ? "WhatsApp kısıtlı — mesaj Telegram'a kopyala-gönder olarak iletildi" : "WhatsApp kısıtlı — bu mesaj zaten Telegram'a iletilmişti" }, { status: 423 });
  }
  if (direction === "out" && !fromPhone) {
    const pre = decide(existing);
    if (!pre.allowed) return NextResponse.json({ ok: false, allowed: false, reason: pre.reason }, { status: 423 });
  }
  let blockedReason: string | null = null;
  let duplicate = false;
  const norm = (t: string) => t.replace(/\s+/g, " ").trim().toLocaleLowerCase("tr-TR");

  // Telefondan yazılan mesaj geriye dönük işlenirken asıl saati korunur (en fazla 7 gün geriye)
  const atMs = (fromPhone || backfill) && typeof body.at === "string" ? Date.parse(body.at) : NaN;
  const at = Number.isFinite(atMs) && atMs <= now.getTime() && now.getTime() - atMs < 7 * 86_400_000 ? new Date(atMs) : now;
  const msg: AiMessageRecord = { id: randomUUID(), at: at.toISOString(), channel, direction, kind, text, ...(kind === "ai" && body.handoff === true ? { handoff: true } : {}), ...(waId ? { waId } : {}) };
  let unfailed = false;
  const intentRaw = str(body.intent) as InboundIntent | undefined;
  const intent: InboundIntent =
    direction === "in" ? (intentRaw && INTENTS.includes(intentRaw) ? intentRaw : detectInboundIntent(text)) : "unknown";

  const updated = await mutateCouple(id, (c) => {
    if (fromPhone) {
      const t = norm(text0);
      // "Gönderilemedi" diye kayıtlı mesajı sahibi telefondan (kopyala-yapıştır) göndermiş → aynı kayıt "gitti" olur
      const failed = c.messages.find((m) => m.direction === "out" && m.text.startsWith("[GÖNDERİLEMEDİ]") && norm(m.text.replace(/^\[GÖNDERİLEMEDİ\]\s*/, "")) === t && Math.abs(at.getTime() - Date.parse(m.at)) < 72 * 3600_000);
      if (failed) {
        unfailed = true;
        return { ...c, messages: c.messages.map((m) => (m.id === failed.id ? { ...m, text: m.text.replace(/^\[GÖNDERİLEMEDİ\]\s*/, ""), at: at.toISOString(), ...(waId ? { waId } : {}) } : m)).sort((x, y) => x.at.localeCompare(y.at)), updatedAt: now.toISOString() };
      }
      // Otomasyonun kendi gönderdiği mesaj da WhatsApp'tan "fromMe" döner → aynısı son 30 dk'da kayıtlıysa tekrar yazma
      const recent = c.messages.filter((m) => m.direction === "out" && !m.text.startsWith("[GÖNDERİLEMEDİ]") && Math.abs(at.getTime() - Date.parse(m.at)) < (backfill ? 36 * 3600_000 : 30 * 60_000));
      const isMedia = text0.startsWith("[");
      const mt = (m: AiMessageRecord) => norm(m.text.replace(/^\[GERİ ÇEKİLDİ\]\s*/, ""));
      if (recent.some((m) => mt(m) === t || (isMedia && /^\[(PDF|belge|fotoğraf|video|sesli)/.test(m.text) && Math.abs(at.getTime() - Date.parse(m.at)) < 30 * 60_000) || (t.length >= 40 && mt(m).includes(t.slice(0, 80))))) {
        duplicate = true;
        return c;
      }
    } else if (direction === "in" && backfill) {
      const t = norm(text0);
      if (c.messages.some((m) => m.direction === "in" && Math.abs(at.getTime() - Date.parse(m.at)) < 36 * 3600_000 && norm(m.text) === t)) {
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
    // "Düşünüyor" durumundaki müşteri tekrar ilgiyle yazdı (fiyat / tarih / paket sordu) → artık düşünmüyor, normal takibe döner
    else if (intent === "interested" && next.status === "thinking") next = { ...next, status: "contacted", followUpAt: undefined, timeline: [...next.timeline, { at: msg.at, type: "edit", text: "Düşünüyordu, tekrar ilgiyle yazdı — normal takibe döndü" }] };
    // "WhatsApp'tan yazın / buradan yazsanız / mesajla konuşalım / arama yerine" → aranmak yerine yazışmayı tercih ediyor
    if (!next.prefersWhatsapp && /((whats?app|watsap|vatsap|\bwp\b|bur(a)?dan|mesaj(la|dan)?)[^.?!\n]{0,25}(yaz|konuş|devam|ileti[şs]im|olur mu)|arama yerine|aranmak istemiyorum|telefonla değil)/i.test(text) && !/(aray[ıi]n|arayabilirsiniz)/i.test(text)) {
      next = { ...next, prefersWhatsapp: true, timeline: [...next.timeline, { at: msg.at, type: "edit", text: "İletişim tercihi: WhatsApp (aranmak yerine yazışmak istedi) — takipte önce 2 mesaj, sonra arama" }] };
    }
    // "Akşam 7'de arayın / yarın öğlen müsaitim" → aramayı o saate kur (henüz telefonda konuşulmadıysa)
    // Bizim son mesajımız aramaya dairse ("sizi arayacağız", "hangi saatte arayalım") müşterinin yazdığı saat = arama saati ("13:40'tan sonra olur mu")
    const prevOut = [...c.messages].reverse().find((m) => m.direction === "out");
    const offeredCall = !!prevOut && /(arayaca|arayal|aramam[ıi]z|arar[ıi]z|hangi saat|saatte ara|sizi ara)/i.test(prevOut.text);
    const eventWords = /(nikah|nikâh|d[üu]ğ[üu]n|k[ıi]na|ni[şs]an|[çc]ekim|t[öo]ren|salon|kuaf[öo]r)/i.test(text);
    const wantsCall = (/(aray[ıi]n|arayabilir|arars[aı]n[ıi]z|ararsan|m[üu]sait(im|iz)|uygunum|uygunuz|d[öo]n[üu]n|g[öo]r[üu][şs]elim|g[öo]r[üu][şs]ebiliriz)/i.test(text) && !/(tl|lira|fiyat|[üu]cret|\bbin\b|\d{3})/i.test(text)) || (offeredCall && !eventWords && !/(tl|lira|fiyat|[üu]cret)/i.test(text));
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
  if (unfailed) return NextResponse.json({ ok: true, allowed: true, unfailed: true, couple: updated });
  if (blockedReason) return NextResponse.json({ ok: false, allowed: false, reason: blockedReason }, { status: 423 });

  // Sahibi müşteriye elle yazdı (telefondan / panelden) → asistan öğrensin (örnek bankası + öneriden farklıysa ders)
  if (direction === "out" && kind === "reply" && updated && !backfill) {
    void onOwnerReply(id, text).catch((e) => console.error("[wa-learning]", e));
  }

  // Gelen her cevap Telegram'a (otomatik cevap YOK; sahibi/ekip cevaplar)
  if (direction === "in" && updated && !backfill) {
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
