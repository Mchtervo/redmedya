/**
 * AI Çift Takip — iş kuralları (saf fonksiyonlar, dosya erişimi yok).
 *
 * Değişmez kurallar:
 *  1. Kara listedeki çifte HİÇBİR kanaldan arama/mesaj yapılmaz; kayıt silinmez.
 *  2. Düğün.com çiftine en fazla 1 sesli arama; çift "tekrar arayın" derse +1 hak.
 *  3. Aramalar yalnızca 10:00–20:00 (İstanbul) arası.
 *  4. Ilık ("düşüneyim" / cevapsız) çifte tam 7 gün sonra 1 kez takip mesajı.
 *  5. Kontenjan rakamı her zaman GERÇEK sayıdır; azalmadıysa "azaldı" denmez.
 */
import type {
  AiCallOutcome,
  AiCapacityInfo,
  AiCouple,
  AiCoupleGrade,
  AiCoupleSource,
  AiCoupleStatus,
} from "@/types/ai-couples";

export const CALL_WINDOW = { startHour: 10, endHour: 20 } as const;
/** Otomatik WhatsApp/SMS de gece gitmez. */
export const MESSAGE_WINDOW = { startHour: 9, endHour: 21 } as const;
export const FOLLOW_UP_DAYS = 7;
const DAY_MS = 86_400_000;

/** Kaynağa göre en fazla sesli arama sayısı ("tekrar arayın" hariç). */
export const MAX_CALLS: Record<AiCoupleSource, number> = {
  dugun_com: 1,
  meta_form: 1,
  web: 1,
  manual: 1,
};

export const GRADE_LABEL: Record<AiCoupleGrade, string> = {
  hot: "🔥 Sıcak",
  warm: "🌤️ Ilık",
  cold: "❄️ Soğuk",
  blacklist: "🚫 Kara Liste",
};

export const STATUS_LABEL: Record<AiCoupleStatus, string> = {
  new: "Yeni",
  contacted: "İletişime geçildi",
  info_sent: "Katalog gönderildi",
  thinking: "Düşünüyor",
  offer_requested: "Teklif istedi",
  won: "Rezervasyon yaptı",
  lost: "İlgilenmiyor",
  locked: "İletişim kapalı",
};

export const OUTCOME_LABEL: Record<AiCallOutcome, string> = {
  no_answer: "Açmadı",
  info_requested: "Bilgi istedi",
  offer_requested: "Teklif istedi",
  thinking: "Düşünecek",
  callback_requested: "Tekrar arayın dedi",
  not_interested: "İlgilenmiyor",
  booked_elsewhere: "Başkasıyla anlaştı",
  do_not_contact: "Aramayın dedi",
};

/** Türkiye cep numarasını 90XXXXXXXXXX biçimine çevirir; geçersizse null. */
export function normalizePhone(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let d = String(raw).replace(/\D/g, "");
  if (d.startsWith("0090")) d = d.slice(2);
  if (d.length === 11 && d.startsWith("0")) d = `9${d}`;
  if (d.length === 10 && d.startsWith("5")) d = `90${d}`;
  if (!/^905\d{9}$/.test(d)) return null;
  return d;
}

export function displayPhone(p: string): string {
  const m = p.match(/^90(\d{3})(\d{3})(\d{2})(\d{2})$/);
  return m ? `0${m[1]} ${m[2]} ${m[3]} ${m[4]}` : p;
}

/** İstanbul saatine göre saat (0-23) ve gün anahtarı. */
export function istanbulParts(now: Date): { hour: number; day: string } {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Istanbul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  return {
    hour: Number(parts.hour) % 24,
    day: `${parts.year}-${parts.month}-${parts.day}`,
  };
}

export function isWithinCallWindow(now: Date): boolean {
  const { hour } = istanbulParts(now);
  return hour >= CALL_WINDOW.startHour && hour < CALL_WINDOW.endHour;
}

export type ContactChannel = "call" | "whatsapp" | "sms";

export type ContactDecision = { allowed: true } | { allowed: false; reason: string };

/** Bir çifte şu an bu kanaldan ulaşılabilir mi? Tüm gönderimlerden önce sorulur. */
export function canContact(
  c: AiCouple,
  channel: ContactChannel,
  now: Date = new Date()
): ContactDecision {
  if (c.contactLocked || c.grade === "blacklist") {
    return { allowed: false, reason: "Kara liste — iletişim kapalı" };
  }
  if (c.status === "won") {
    return { allowed: false, reason: "Rezervasyon yapmış çift — satış iletişimi yok" };
  }
  if (channel !== "call") {
    const { hour } = istanbulParts(now);
    if (hour < MESSAGE_WINDOW.startHour || hour >= MESSAGE_WINDOW.endHour) {
      return { allowed: false, reason: "Mesaj saatleri dışında (09:00–21:00)" };
    }
  }
  if (channel === "call") {
    if (!isWithinCallWindow(now)) {
      return { allowed: false, reason: "Arama saatleri dışında (10:00–20:00)" };
    }
    const max = MAX_CALLS[c.source] ?? 1;
    if (c.callCount >= max && !c.callbackRequested && !isFollowUpCallDue(c, now) && !isSecondCallDue(c, now)) {
      return {
        allowed: false,
        reason: `Arama hakkı doldu (${c.callCount}/${max}); takip WhatsApp'tan`,
      };
    }
  }
  return { allowed: true };
}

export function lockCouple(c: AiCouple, reason: string, now: Date): AiCouple {
  const at = now.toISOString();
  return {
    ...c,
    contactLocked: true,
    grade: "blacklist",
    status: "locked",
    lockReason: reason,
    lockedAt: c.lockedAt ?? at,
    followUpAt: undefined,
    callbackRequested: false,
    timeline: [...c.timeline, { at, type: "locked", text: `Kara listeye alındı: ${reason}` }],
    updatedAt: at,
  };
}

/** Ilık/düşünüyor durumuna al ve 7 gün sonrasına tek takip planla. */
export function markThinking(c: AiCouple, now: Date, why: string): AiCouple {
  if (c.contactLocked) return c;
  const at = now.toISOString();
  const alreadyPlanned = Boolean(c.followUpAt) && !c.followUpSentAt;
  return {
    ...c,
    grade: c.grade === "hot" ? "hot" : "warm",
    status: "thinking",
    followUpAt: alreadyPlanned
      ? c.followUpAt
      : c.followUpSentAt
        ? undefined // takip zaten 1 kez gönderildi; tekrar planlanmaz
        : new Date(now.getTime() + FOLLOW_UP_DAYS * DAY_MS).toISOString(),
    timeline: [...c.timeline, { at, type: "thinking", text: why }],
    updatedAt: at,
  };
}

/** Arama sonucunu çiftin durumuna uygular (kayıt ekleme ayrı yapılır). */
export function applyCallOutcome(
  c: AiCouple,
  outcome: AiCallOutcome,
  now: Date,
  quotedRemaining?: number
): AiCouple {
  const at = now.toISOString();
  let next: AiCouple = {
    ...c,
    callCount: c.callCount + 1,
    lastCallAt: at,
    // Kullanılmış "tekrar arayın" hakkı bu aramayla tükenir.
    callbackRequested: false,
    lastQuotedRemaining:
      typeof quotedRemaining === "number" ? quotedRemaining : c.lastQuotedRemaining,
    updatedAt: at,
    timeline: [...c.timeline, { at, type: "call", text: `Arama: ${OUTCOME_LABEL[outcome]}` }],
  };
  if (next.status === "new") next.status = "contacted";

  // "Düşüneyim" takibi için yapılan 2. arama açıldıysa takip tamamlanmış sayılır
  // (ayrıca WhatsApp takip mesajı gitmez, yeni takip planlanmaz → döngü yok).
  if (outcome !== "no_answer" && c.followUpAt && !c.followUpSentAt && new Date(c.followUpAt).getTime() <= now.getTime()) {
    next = {
      ...next,
      followUpSentAt: at,
      timeline: [...next.timeline, { at, type: "follow_up", text: "1 hafta sonraki takip araması yapıldı" }],
    };
  }

  switch (outcome) {
    case "booked_elsewhere":
      return lockCouple(next, "Başka fotoğrafçıyla anlaştı", now);
    case "do_not_contact":
      return lockCouple(next, "Aranmak istemiyor", now);
    case "info_requested":
      next = { ...next, grade: "hot", status: "contacted" };
      break;
    case "offer_requested":
      next = { ...next, grade: "hot", status: "offer_requested" };
      break;
    case "thinking":
      next = markThinking(next, now, "Telefonda düşüneceğini söyledi");
      break;
    case "callback_requested":
      next = {
        ...next,
        callbackRequested: true,
        grade: next.grade === "hot" ? "hot" : "warm",
      };
      break;
    case "not_interested":
      next = { ...next, grade: "cold", status: "lost", followUpAt: undefined };
      break;
    case "no_answer":
      if (next.grade !== "hot" && next.grade !== "warm") next.grade = "cold";
      break;
  }
  return next;
}

function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "";
}

/** Görüşmeden sonra giden katalog mesajı (2027 fiyat listesi PDF'i ekte gider). */
export function buildCatalogMessage(
  c: AiCouple,
  links: { packages: string; gallery: string; video?: string }
): string {
  const hi = firstName(c.name) ? `Merhaba ${firstName(c.name)},` : "Merhaba,";
  const lines = [
    `${hi} RED MEDIA'dan yazıyoruz, görüşmemiz için teşekkür ederiz. 🤍`,
    "",
    "📎 2027 fiyat listemiz ekte:",
    "• Fotoğraf Çekimi: 5.000 TL",
    "• Fotoğraf + Sinematik Klip: 9.000 TL",
    "• Fotoğraf + Klip + Albüm: 14.000 TL (1 büyük + 2 aile albümü, 22 düzenlenmiş fotoğraf hediye)",
    "Tüm paketlerde poz sınırı yok, çekilenlerin tümü teslim.",
    "Pakete eklenen ekstra hizmetlerde %20 indirim; kampanya yerlerinden ayırtan çiftlere dış çekimde drone hediye.",
    "",
    "⏳ Fiyatlar 31 Aralık 2026'ya kadar geçerli. Bir ayın kampanya yerleri dolunca o ay için %40 zam geliyor.",
    "Tarihinizi 24 saat ücretsiz tutuyoruz; 1.000 TL kapora ile kesinleşiyor (15.000 TL üzeri tutarlarda 2.000 TL). Kalan ödeme çekim günü.",
    "",
    `📸 Örnek çalışmalarımız: ${links.gallery}`,
  ];
  if (links.video) lines.push(`🎬 Örnek video: ${links.video}`);
  lines.push("", "Düğün tarihinizi bu mesaja yazın, müsaitliği hemen kontrol edelim.");
  return lines.join("\n");
}

/**
 * 7. gün takip mesajı — kontenjan rakamı GERÇEK.
 * Önceki konuşmada söylenen rakamdan azaldıysa karşılaştırmalı; değilse sade.
 * Ay dolduysa kıtlık mesajı yerine dürüst bilgi.
 */
export function buildFollowUpMessage(c: AiCouple, cap: AiCapacityInfo | null): string {
  const hi = firstName(c.name) ? `Merhaba ${firstName(c.name)},` : "Merhaba,";
  if (cap && cap.remaining <= 0) {
    return `${hi} RED MEDIA'dan yazıyoruz. ${cap.monthLabel} için kontenjanımız doldu; farklı bir tarih düşünürseniz memnuniyetle yardımcı oluruz. 🤍`;
  }
  if (cap && typeof c.lastQuotedRemaining === "number" && cap.remaining < c.lastQuotedRemaining) {
    return `${hi} geçen hafta görüştüğümüzde ${c.lastQuotedRemaining} çiftlik kontenjanımız kalmıştı, şu an son ${cap.remaining} çiftlik yerimiz kaldı, bilginiz olsun. 🤍`;
  }
  if (cap) {
    return `${hi} RED MEDIA'dan yazıyoruz. ${cap.monthLabel} için şu an ${cap.remaining} çiftlik yerimiz kaldı, bilginiz olsun. Sorularınız olursa buradayız. 🤍`;
  }
  return `${hi} RED MEDIA'dan yazıyoruz. Geçen hafta görüşmüştük; aklınıza takılan bir şey olursa buradayız, bilginiz olsun. 🤍`;
}

export type InboundIntent = "stop" | "booked_elsewhere" | "not_interested" | "thinking" | "interested" | "unknown";

function fold(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ı/g, "i")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c");
}

/**
 * Gelen WhatsApp mesajından niyet (yedek kural; n8n/AI de `intent` gönderebilir).
 * "Durdur" niyetleri önce kontrol edilir — şüphede kilit tarafında kalınır.
 */
export function detectInboundIntent(text: string): InboundIntent {
  const t = fold(text);
  if (/(aramayin|aranmak istemiyorum|rahatsiz etmeyin|mesaj atmayin|yazmayin|listeden cikar|bir daha (arama|yazma|mesaj)|iletisim istemiyorum|^istemiyorum|^istemiyoruz|yazmayiniz|numarami sil|\bstop\b|\biptal\b)/.test(t)) {
    return "stop";
  }
  // "Sizinle anlaştık" yanlışlıkla kilitlemesin diye yalnızca "başka" geçen kalıplar.
  if (/(baska (bir )?(fotografci|firma|yer|ekip)|baskasiyla anlastik|baska yerle anlastik|fotografcimiz var|fotografci bulduk|fotografci ayarladik)/.test(t)) {
    return "booked_elsewhere";
  }
  if (/(ilgilenmiyor|butce(miz)? (uymuyor|yetmiyor|uygun degil)|pahali geldi|cok pahali|vazgectik|gerek yok|dusunmuyoruz)/.test(t)) {
    return "not_interested";
  }
  if (
    /(dusun|danisayim|konusup don|haber verir|donus yapar|sonra yaz|bakip don|kararsiz|netlestir|emin degil|simdilik bakiyoruz|daha erken)/.test(t) ||
    /(nisanli|esim|esime|kocam|karim|sevgilim|ailem|annem|babam|kayinvalide)\w*\s+(bir\s+)?(sor|danis|konus)/.test(t)
  ) {
    return "thinking";
  }
  if (/(fiyat|teklif|paket|musait|tarih|ne kadar|bilgi alabilir|detay|kapora|kaparo|rezervasyon|sizinle anlas|anlasalim|onayliyoruz)/.test(t)) {
    return "interested";
  }
  return "unknown";
}

/** "Düşüneyim" takibinin zamanı geldi mi? (önce arama, açmazsa WhatsApp) */
function followUpTime(c: AiCouple, now: Date): boolean {
  if (!c.followUpAt || c.followUpSentAt) return false;
  if (c.contactLocked || c.status === "won" || c.status === "lost") return false;
  return new Date(c.followUpAt).getTime() <= now.getTime();
}

/** Takip zamanı geldi ve 1 haftalık tekrar araması henüz yapılmadı → ARA. */
export function isFollowUpCallDue(c: AiCouple, now: Date): boolean {
  if (!followUpTime(c, now)) return false;
  const since = new Date(c.followUpAt as string).getTime();
  return !c.calls.some((x) => new Date(x.at).getTime() >= since);
}

/** 1. arama ile 2. arama arasında en az bu kadar beklenir (o arada WhatsApp gider). */
export const SECOND_CALL_GAP_MS = 2 * 3600_000;

/**
 * 2. arama zamanı mı? 1. arama açılmadı → WhatsApp gönderildi → çift WhatsApp'a da dönmedi
 * → en az 2 saat sonra 1 kez daha aranır. Çift WhatsApp'tan herhangi bir cevap verdiyse aranmaz.
 * İkinci aramadan sonra bir daha ARANMAZ.
 */
export function isSecondCallDue(c: AiCouple, now: Date): boolean {
  if (c.contactLocked || c.status === "won" || c.status === "lost") return false;
  if (c.calls.length !== 1 || c.calls[0].outcome !== "no_answer") return false;
  const first = new Date(c.calls[0].at).getTime();
  if (now.getTime() - first < SECOND_CALL_GAP_MS) return false;
  const after = c.messages.filter((m) => new Date(m.at).getTime() >= first);
  if (after.some((m) => m.direction === "in")) return false;                 // WhatsApp'tan döndü → arama yok
  return after.some((m) => m.direction === "out" && m.channel === "whatsapp"); // önce WhatsApp gitmiş olmalı
}

/** Takip WhatsApp mesajı: tekrar araması denendi ama açılmadı → MESAJ. */
export function isFollowUpDue(c: AiCouple, now: Date): boolean {
  return followUpTime(c, now) && !isFollowUpCallDue(c, now);
}

export const AI_EVENTS = ["thinking", "no_reply", "offer_requested", "won", "do_not_contact", "booked_elsewhere"] as const;
export type AiEvent = (typeof AI_EVENTS)[number];

export function applyEvent(c: AiCouple, ev: AiEvent, now: Date): AiCouple {
  const at = now.toISOString();
  switch (ev) {
    case "thinking":
      return markThinking(c, now, "WhatsApp: düşüneceğini söyledi");
    case "no_reply":
      return markThinking(c, now, "WhatsApp: görüldü / cevap yok");
    case "offer_requested":
      return c.contactLocked
        ? c
        : { ...c, grade: "hot", status: "offer_requested", updatedAt: at, timeline: [...c.timeline, { at, type: "offer", text: "Teklif istedi" }] };
    case "won":
      return { ...c, grade: c.contactLocked ? c.grade : "hot", status: c.contactLocked ? c.status : "won", followUpAt: undefined, updatedAt: at, timeline: [...c.timeline, { at, type: "won", text: "Rezervasyon yaptı" }] };
    case "do_not_contact":
      return lockCouple(c, "Aranmak / mesaj almak istemiyor", now);
    case "booked_elsewhere":
      return lockCouple(c, "Başka fotoğrafçıyla anlaştı", now);
  }
}

