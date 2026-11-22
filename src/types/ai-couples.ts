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
  /** Sesli asistanın görüşmeden çıkardığı notlar (WhatsApp mesajını kişiselleştirmek için) */
  notes?: {
    paket?: string;
    ekstralar?: string;
    cekimTuru?: string;
    itiraz?: string;
    tarihTut?: boolean;
  };
};

export type AiMessageChannel = "whatsapp" | "sms" | "dugun_com" | "telegram" | "instagram";

export type AiMessageRecord = {
  id: string;
  at: string;
  channel: AiMessageChannel;
  direction: "out" | "in";
  /** ai = WhatsApp'ta yapay zekânın verdiği otomatik cevap */
  kind?: "welcome" | "catalog" | "follow_up" | "reply" | "other" | "ai";
  text: string;
  /** Yapay zekâ bu mesajla konuşmayı sahibine devretti (bekletme mesajı) */
  handoff?: boolean;
};

export type AiTimelineEvent = {
  at: string;
  type: string;
  text: string;
};

export type AiCouple = {
  id: string;
  name: string;
  /** Yapay zekânın çıkardığı gidişat özeti ("şu an nerede": ne istedi, ne verildi, sırada ne var) */
  aiSummary?: string;
  aiSummaryAt?: string;
  /** Müşteri aranmak yerine WhatsApp'tan yazışmayı tercih etti (arama teklif edilmez; takipte önce 2 mesaj, sonra arama) */
  prefersWhatsapp?: boolean;
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
  /** "Tekrar arayın" / hat meşgul → bu andan önce aranmaz */
  callbackAt?: string;
  /** Art arda "hat meşgul" denemesi (en fazla 2 tekrar, sonra normal "açmadı" akışı) */
  busyRetries?: number;
  /** Admin planlanan/otomatik aramaları iptal etti — otomatik aranmaz (WhatsApp ve elle arama devam) */
  callsPaused?: boolean;
  /** Talebin kaynağındaki (Düğün.com vb.) GERÇEK tarihi — sonradan aktarılan eski taleplerde sıralama için */
  leadAt?: string;
  /** Çift bizi geri aradı ve sahibi telefonda görüştü (son zaman) */
  inboundAt?: string;
  /** Admin otomatik WhatsApp mesajlarını iptal etti (kampanya, takip, hatırlatma) — elle cevap devam */
  messagesPaused?: boolean;
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
  /** "İlk 10 çifte dış çekimde drone hediye" — kalan hediye hakkı (elle güncellenir) */
  droneGiftLeft: number;
  /** Aynı gün en fazla kaç düğün çekilebilir (varsayılan 1) */
  perDay?: number;
  /** Elle kapatılan günler (YYYY-MM-DD) — rezervasyon sistemine girmemiş iş, izin vb. */
  blockedDates?: string[];
  updatedAt: string;
};

/** Tek bir günün müsaitliği (sesli asistan çifte söylemeden önce bunu sorar) */
export type AiDateCheck = {
  date: string;
  /** "17 Temmuz 2027 Cumartesi" */
  dateLabel: string;
  available: boolean;
  /** "musait" | "dolu" | "ay_dolu" | "kapali" | "gecmis" */
  reason: "musait" | "dolu" | "ay_dolu" | "kapali" | "gecmis";
  bookedOnDate: number;
  perDay: number;
  month: AiCapacityInfo;
  /** Yakın müsait tarihler (dolu ise öneri) */
  alternatives: { date: string; dateLabel: string }[];
  /** Asistanın aynen söyleyebileceği kısa Türkçe cümle */
  cevap: string;
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
      /** Asistanın açılışı: "Merhabalar Ayşe Hanım" */
      selam?: string;
      /** Son arama sonucu ya da meşgul kaydının zamanı */
      lastResultAt?: string;
      /** Son 2 saatte gelen GERÇEK yeni talep: günlük arama sınırına takılmaz, en önce aranır */
      urgent?: boolean;
      /** Asistanın aramadan önce bilmesi gereken geçmiş (SMS, önceki aramalar, WhatsApp, cevaplar) */
      history: string;
      /** "Düşüneyim" diyen çiftin 1 hafta sonraki 2. araması */
      followUp: boolean;
      reason: string;
    }
  | {
      type: "whatsapp";
      /** Gece de gönderilebilen anlık karşılama (yeni form talebi) */
      night?: boolean;
      kind: "catalog" | "follow_up" | "other" | "welcome";
      coupleId: string;
      name: string;
      phone: string;
      text: string;
      /** Varsa mesaj bu dosyayla (PDF) gönderilir; text açıklama olur */
      mediaUrl?: string;
      fileName?: string;
      reason: string;
    };
