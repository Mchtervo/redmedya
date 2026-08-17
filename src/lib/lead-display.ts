import { getPackage, getPlato, type PlatoId } from "@/config/pricing";
import type { LeadRecord } from "@/types/site-settings";

const PLATO_IDS: PlatoId[] = ["baska", "no25", "anka", "own"];

export function leadPackageLabel(lead: LeadRecord): string {
  const raw = lead.cart.selectedIds.find((id) => id.startsWith("paket-"));
  if (raw) {
    const n = Number(raw.slice(6));
    if (n === 1 || n === 2 || n === 3) {
      const p = getPackage(n);
      return `${p.name} — ${p.subtitle}`;
    }
  }
  const fromSummary = lead.cart.lineSummary.find((line) =>
    /^Paket\s+[123]/i.test(line)
  );
  return fromSummary?.split(" — ")[0] ?? "Paket seçilmedi";
}

export function leadPlatoLabel(lead: LeadRecord): string {
  const raw = lead.cart.selectedIds.find((id) => id.startsWith("plato-"));
  if (!raw) return "Sonra karar vereceğim";
  const id = raw.slice("plato-".length) as PlatoId;
  if (PLATO_IDS.includes(id)) return getPlato(id).name;
  return id;
}

export function leadSourceLabel(source: string): string {
  if (source === "package_whatsapp") return "Sepet WhatsApp";
  if (source === "whatsapp") return "Paket oluştur";
  return source || "WhatsApp";
}

export function isWhatsAppPackageLead(lead: LeadRecord): boolean {
  const s = (lead.source ?? "").toLowerCase();
  return s === "whatsapp" || s.includes("whatsapp") || s === "";
}
