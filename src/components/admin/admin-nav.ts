import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  CalendarDays,
  Inbox,
  ShoppingCart,
  Contact,
  Layers,
  Settings2,
  Database,
} from "lucide-react";

export type AdminTabId =
  | "overview"
  | "calendar"
  | "leads"
  | "packages"
  | "rehber"
  | "cms"
  | "operations"
  | "data";

export type AdminNavItem = {
  id: AdminTabId;
  label: string;
  description: string;
  icon: LucideIcon;
};

export const ADMIN_NAV: AdminNavItem[] = [
  {
    id: "overview",
    label: "Genel bakış",
    description: "Özet ve yaklaşan düğünler",
    icon: LayoutDashboard,
  },
  {
    id: "calendar",
    label: "Takvim",
    description: "Onaylı rezervasyonlar",
    icon: CalendarDays,
  },
  {
    id: "leads",
    label: "Teklifler",
    description: "WhatsApp talepleri",
    icon: Inbox,
  },
  {
    id: "packages",
    label: "Sepetler",
    description: "İstatistik & yarım sepet",
    icon: ShoppingCart,
  },
  {
    id: "rehber",
    label: "Rehber",
    description: "Çift iletişimleri",
    icon: Contact,
  },
  {
    id: "cms",
    label: "Hizmetler",
    description: "Fiyat & kupon",
    icon: Layers,
  },
  {
    id: "operations",
    label: "Site ayarları",
    description: "Kontenjan & içerik",
    icon: Settings2,
  },
  {
    id: "data",
    label: "Veriler",
    description: "Dışa aktar",
    icon: Database,
  },
];

/**
 * Sidebar bölüm grupları — eğitim almaya değer olmasa da görsel olarak
 * geniş menüyü 2-3 mantıklı bölüme ayırır.
 */
export const ADMIN_NAV_GROUPS: { title: string; ids: AdminTabId[] }[] = [
  { title: "Operasyon", ids: ["overview", "calendar", "leads"] },
  { title: "Müşteri", ids: ["packages", "rehber"] },
  { title: "Ayarlar", ids: ["cms", "operations", "data"] },
];

export function isAdminTab(id: string | null): id is AdminTabId {
  return ADMIN_NAV.some((n) => n.id === id);
}
