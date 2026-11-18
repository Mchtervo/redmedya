/**
 * AI Çift Takip ve Satış Sistemi — veri modeli.
 * Kayıtlar ASLA silinmez; "Kara Liste" bir kilit durumudur.
 */

export type AiCoupleSource = "dugun_com" | "meta_form" | "web" | "manual";

/** 🔥 Sıcak · 🌤️ Ilık · ❄️ Soğuk · 🚫 Kara Liste */
export type AiCoupleGrade = "hot" | "warm" | "cold" | "blacklist";

export type AiCoupleStatus =
  | "new" // henüz aranmadı
  | "contacted" // arandı / mesaj atıldı
  | "info_sent" // katalog gönderildi
  | "thinking" // "düşüneyim" / görüldü-cevapsız → 7 gün sonra takip
  | "offer_requested" // teklif istedi
  | "won" // rezervasyon yaptı
  | "lost" // ilgilenmiyor
  | "locked"; // kara liste — iletişim kapalı

/** Sesli aramanın sonucu (Retell/Vapi → n8n → panel) */
export type AiCallOutcome =
  | "no_answer"
  | "info_requested" // bilgi istedi → katalog WhatsApp'tan gider
  | "offer_requested"
  | "thinking"
  | "callback_requested" // "tekrar arayın" → 1 arama hakkı daha
  | "not_interested"
  | "booked_elsewhere" // başkasıyla anlaştı → KARA LİSTE
  | "do_not_contact"; // bir daha aramayın → KARA LİSTE

export type AiCallRecord = {
  id: string;
  at: string;
  provider?: string; // retell | vapi | manual
  externalId?: string;
  durationSec?: number;
  recordingUrl?: string;
  summary?: string;
  transcript?: string;
  outcome: AiCallOutcome;
  /** Aramada çifte söylenen gerçek kalan kontenjan */
  quotedRemaining?: number;
};

export type AiMessageChannel = "whatsapp" | "sms" | "dugun_com" | "telegram";

export type AiMessageRecord = {
  id: string;
  at: string;
  channel: AiMessageChannel;
  direction: "out" | "in";
  kind?: "welcome" | "catalog" | "follow_up" | "reply" | "other";
  text: string;
};

export type AiTimelineEvent = {
  at: string;
  type: string;
  text: string;
};

export type AiCouple = {
  id: string;
  name: string;
  /** 90XXXXXXXXXX biçiminde normalize */
  phone: string;
  weddingDate?: string; // YYYY-MM-DD
  city?: string;
  source: AiCoupleSource;
  /** Düğün.com talep no / Meta lead id vb. */
  sourceRef?: string;
  note?: string;
  grade: AiCoupleGrade;
  status: AiCoupleStatus;

  /** Kara liste kilidi — API ile AÇILAMAZ, yalnızca admin panelden. */
  contactLocked: boolean;
  lockReason?: string;
  lockedAt?: string;

  callCount: number;
  lastCallAt?: string;
  /** Çift "tekrar arayın" dedi → bir arama hakkı daha */
  callbackRequested: boolean;
  calls: AiCallRecord[];
  messages: AiMessageRecord[];

  /** Ilık çifte otomatik takip zamanı (thinking + 7 gün) */
  followUpAt?: string;
  followUpSentAt?: string;
  /** Son konuşmada söylenen kalan kontenjan (takip mesajında karşılaştırma için) */
  lastQuotedRemaining?: number;

  timeline: AiTimelineEvent[];
  createdAt: string;
  updatedAt: string;
};

export type AiCapacityConfig = {
  /** Aylık varsayılan çift kapasitesi */
  defaultPerMonth: number;
  /** Ay (2027-06) → o ayın toplam kapasitesi */
  months: Record<string, number>;
  /** Elle düşülen ek dolu yer (rezervasyon sistemine girmemiş işler) */
  manualBooked: Record<string, number>;
  updatedAt: string;
};

export type AiCapacityInfo = {
  monthKey: string;
  monthLabel: string;
  total: number;
  booked: number;
  remaining: number;
};

export type AiQueueAction =
  | {
      type: "call";
      coupleId: string;
      name: string;
      phone: string;
      weddingDate?: string;
      source: AiCoupleSource;
      capacity: AiCapacityInfo | null;
      /** Sesli asistanın okuyacağı gerçek kontenjan cümlesi (ör. "Haziran 2027 için 2 çiftlik yer kaldı, …") */
      capacitySpeech: string;
      reason: string;
    }
  | {
      type: "whatsapp";
      kind: "catalog" | "follow_up";
      coupleId: string;
      name: string;
      phone: string;
      text: string;
      reason: string;
    };
