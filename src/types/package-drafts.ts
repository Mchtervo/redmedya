import type { LeadLineDetail } from "@/types/reservations";

export type PackageDraftCustomer = {
  firstName: string;
  lastName: string;
  phone: string;
  weddingDate: string;
  note: string;
};

export type PackageDraftRecord = {
  /** Tarayıcı oturum kimliği */
  sessionId: string;
  updatedAt: string;
  createdAt: string;
  customer: PackageDraftCustomer;
  selectedIds: string[];
  lineDetails: LeadLineDetail[];
  lineSummary: string[];
  subtotal: number;
  total: number;
  count: number;
  /** WhatsApp / teklif butonuna tıklandı mı */
  whatsappClicked: boolean;
  leadId?: string;
};
