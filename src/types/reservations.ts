import type { CustomerInfo } from "@/stores/package-store";

export type LeadLineDetail = {
  /** Paket CMS hizmet kimliği */
  serviceId?: string;
  label: string;
  price: number;
  /** Üstü çizili gösterim (liste fiyatı) */
  listPrice?: number;
  isGift?: boolean;
  /** Çarpı — listede kalır, toplama dahil edilmez */
  excluded?: boolean;
  /** Hizmet bazlı çekim yeri */
  shootingLocation?: string;
  /** Hizmet bazlı saat (örn. 14:00) */
  shootingTime?: string;
  /** Adetli hizmetler (ör. aile albümü 1 veya 2) */
  quantity?: number;
  /** Adet başına birim fiyat (düzenleme için) */
  unitPrice?: number;
  /** Büyük albüm: 10 veya 20 sayfa (20 sayfa = %50 zam) */
  selectedPages?: number;
};

export type LeadStatus = "pending" | "approved" | "rejected";

export type ReservationRecord = {
  id: string;
  leadId: string;
  createdAt: string;
  approvedAt: string;
  customer: CustomerInfo;
  services: LeadLineDetail[];
  subtotal: number;
  bundleDiscount: number;
  couponDiscount: number;
  couponCode?: string;
  total: number;
  depositAmount: number;
  remainingAmount: number;
  note?: string;
  /** Genel çekim / salon adresi */
  shootingLocation?: string;
  /** Ekip içi çekim notu */
  shootingNote?: string;
  /** Dış çekim platosu müşteriye ait değil — bizim plato */
  studioOwned?: boolean;
};

export type RehberContact = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  weddingDate?: string;
  reservationId?: string;
  source: "reservation" | "manual";
  note?: string;
  shootingLocation?: string;
  shootingNote?: string;
  createdAt: string;
};

/** Ana sayfa — telefon gizli */
export type PublicWeddingPreview = {
  id: string;
  couple: string;
  weddingDate: string;
  monthKey: string;
  total: number;
  depositAmount: number;
  remainingAmount: number;
  serviceCount: number;
};
