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
  Activity,
  Filter,
  Users,
  Megaphone,
  FormInput,
  Bug,
} from "lucide-react";

export type AdminTabId =
  | "overview"
  | "calendar"
  | "leads"
  | "funnel"
  | "sessions"
  | "ads"
  | "form_errors"
  | "tech_errors"
  | "journey"
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
    label: "Dashboard",
    description: "Özet ve yaklaşan düğünler",
    icon: LayoutDashboard,
  },
  {
    id: "calendar",
    label: "Rezervasyonlar",
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
    id: "funnel",
    label: "Funnel Analizi",
    description: "Drop-off & dönüşüm",
    icon: Filter,
  },
  {
    id: "sessions",
    label: "Sessionlar",
    description: "Kullanıcı yolculukları",
    icon: Users,
  },
  {
    id: "ads",
    label: "Reklam Performansı",
    description: "UTM & kampanya",
    icon: Megaphone,
  },
  {
    id: "form_errors",
    label: "Form Hataları",
    description: "Validation analizi",
    icon: FormInput,
  },
  {
    id: "tech_errors",
    label: "Teknik Hatalar",
    description: "JS / API hataları",
    icon: Bug,
  },
  {
    id: "journey",
    label: "Yolculuk (eski)",
    description: "Legacy funnel",
    icon: Activity,
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

export const ADMIN_NAV_GROUPS: { title: string; ids: AdminTabId[] }[] = [
  {
    title: "Operasyon",
    ids: ["overview", "calendar", "leads"],
  },
  {
    title: "Analitik",
    ids: ["funnel", "sessions", "ads", "form_errors", "tech_errors", "journey"],
  },
  { title: "Müşteri", ids: ["packages", "rehber"] },
  { title: "Ayarlar", ids: ["cms", "operations", "data"] },
];

export function isAdminTab(id: string | null): id is AdminTabId {
  return ADMIN_NAV.some((n) => n.id === id);
}
