import { CAMPAIGN } from "@/config/pricing";

/**
 * PAKET OLUŞTUR V2 — Tüm müşteriye görünen metinler.
 * Kampanya cümleleri buradan kolayca değişsin diye tek dosyada toplandı.
 */
export const COPY = {
  // Üst kampanya bandı
  campaignBanner: `🎁 Kısa süreliğine: plato ÜCRETSİZ + P3'te drone HEDİYE — ${CAMPAIGN.deadlineLabel}'a kadar`,

  header: {
    eyebrow: "Paket oluşturucu · 3 adım",
    title: "Kendi sinematik",
    titleAccent: "düğün paketinizi kurun",
    subtitle:
      "Paketini seç, dilediğin gibi güçlendir, tarihini kilitle. Toplam ve kazancın her adımda canlı güncellenir.",
  },

  steps: ["Paket", "Özelleştir", "Tarih & Onay"] as const,

  savingsBadge: (amount: string) => `🎉 ${amount} kazanıyorsunuz`,
  summarySavings: (amount: string) => `Bu pakette toplam ${amount} kazandınız 🎉`,

  step1: {
    packagesHeading: "Paketini seç",
    ownVenueDiscountLabel: "−₺2.000 indirim",
    freeLabel: "ÜCRETSİZ",
    // "Plato ücreti yok" aciliyet kartı (sahte geri sayım YOK)
    urgency: {
      badge: "KISA SÜRELİ KAMPANYA",
      title: "Plato ücreti YOK 🎁",
      body: "Anlaşmalı platolarımız şu an tamamen ÜCRETSİZ. Kontenjan sınırlı, hafta sonları hızla doluyor — tarihinizi kaçırmayın.",
      cta: "⚡ Hemen paketini seç, tarihini kap",
    },
    platoHeading: "Dış çekim mekânınız — kampanyayla ÜCRETSİZ 🎁",
    platoSubtitle:
      "Kısa süreliğine: anlaşmalı platolarımızdan birini seçin, plato kullanımı paketinize tamamen HEDİYE — hiçbir ek ücret yok.",
    droneRibbon: "🚁 DRONE HEDİYE",
    venueDiscountLine: "Mekân indirimi −₺2.000",
    giftPlatoLine: "Anlaşmalı plato hediye 🎁",
  },

  step2: {
    heading: "Paketini güçlendir ⚡",
    subtitle: "İstediğini ekle, istemediğini çıkar — toplam anında güncellenir.",
    addonsHeading: "Ek hizmetler",
    packageContentsHeading: "Paketinde olanlar",
    includedLabel: "Dahil ✓",
    giftLabel: "Hediye 🎁",
    lockedHint: "Paketin çekirdeği — çıkarılamaz",
    salonFullConflict:
      "Full Sinematik zaten girişi ve ilk dansı kapsıyor — öncekini kaldırdık, ₺3.500 düşüldü.",
    campaignSheet: {
      eyebrow: "🔥 SADECE ŞU AN — PAKET OLUŞTURANLARA ÖZEL",
      title: "Düğününün en çok izlenen anları",
      body: "Gelin alma ve ilk dans, klip izlenmelerinin çoğunu alır. Şimdi ekle, kampanyalı fiyata gir.",
      note: "Sonradan eklemek istersen tanesi ₺5.000 olacak.",
      socialProof: "Çiftlerin %73'ü bu klipleri ekliyor",
      klipGelinAlma: {
        name: "Gelin Alma Klibi",
        desc: "Kapı önü, hazırlık, ilk buluşma anları",
      },
      klipSalonGiris: {
        name: "Salon Girişi & İlk Dans",
        desc: "Görkemli giriş ve ilk dansın sinematik klibi",
      },
      saveEach: "₺1.500 tasarruf",
      addBoth: "İkisini birden ekle",
      addBothSave: "₺3.000 tasarruf",
      dismiss: "Şimdilik geç, sonra karar veririm",
    },
  },

  step3: {
    heading: "Son adım — tarihini söyle",
    dateLabel: "Düğün tarihi",
    nameLabel: "Ad Soyad",
    phoneLabel: "Telefon",
    noteLabel: "Not",
    notePlaceholder: "Eklemek istedikleriniz...",
    optionalToggle: "İsteğe bağlı bilgiler",
    optionalHint: "Telefon ve notunuz — şimdi yazmasanız da WhatsApp'ta sorabiliriz",
    summaryHeading: "Özet",
    copyLink: "Paket linkini kopyala",
    copyLinkDone: "Kopyalandı ✓",
    // Ana CTA metni artık config/experiments.ts (A/B) — buradaki yalnızca fallback
    lockButton: "🔒 Tarihimi Kilitle",
    // Taahhüt korkusunu azaltan, "soru da sorabilirsin" diyen düşük eşikli mikro yazı
    lockMicrocopy:
      "Sorularınız için de yazabilirsiniz — ortalama 15 dk'da dönüyoruz.",
    trust: {
      reviews: "⭐ yorumları gör",
      instagram: "@redmedia.co",
    },
    lastChance: {
      title: "✋ Emin misiniz?",
      body: "Gelin alma ve ilk dans, düğününüzün en çok izlenen anları olur. Bu kliplere kampanyalı ₺3.500 fiyatı sadece şimdi geçerli — sonradan eklemek isterseniz ₺5.000 olacak.",
      addOne: (amount: string) => `🎬 Ekle ve devam et (+${amount})`,
      addBoth: (amount: string) => `İkisini de ekle (+${amount})`,
      skip: "Eklemeden devam et",
    },
  },

  // Adım 2 sticky bar'daki ikincil "form doldurmadan WhatsApp'a geç" yolu
  whatsappShortcut: {
    button: "WhatsApp'ta Tamamla",
    modalTitle: "Düğün tarihiniz?",
    modalBody: "Tek soru — tarihinizi seçin, paketinizle birlikte WhatsApp'a geçelim.",
    modalCta: "WhatsApp'ta Devam Et",
    modalSkip: "Vazgeç",
  },

  // Adım 2/3'te sayfadan ayrılırken tek seferlik yakalama modalı
  exitCapture: {
    title: "Paketiniz kaydedildi 💾",
    body: "Linki kopyalayın, dilediğinizde tam kaldığınız yerden devam edin. Ya da hemen WhatsApp'tan gönderin, tarihinizi konuşalım.",
    copy: "Linki Kopyala",
    copied: "Kopyalandı ✓",
    whatsapp: "WhatsApp'tan Gönder",
    dismiss: "Kapat",
  },

  cta: {
    next: "Devam →",
    back: "← Geri",
    totalPrefix: "Toplam:",
  },

  whatsapp: {
    greeting: "Merhaba, paket oluşturdum 👋",
    closing: "Tarihimi kilitlemek istiyorum.",
  },
} as const;
