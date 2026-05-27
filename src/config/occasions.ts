/** Düğün sürecindeki etkinlikler — foto/video hizmetleri buna göre gruplanır */
export const OCCASIONS = [
  { id: "dis-cekim", label: "Dış Çekim", order: 1 },
  { id: "gelin-alma", label: "Gelin Alma", order: 2 },
  { id: "kina", label: "Kına", order: 3 },
  { id: "kuafor-hazirlik", label: "Kuaför & Hazırlık", order: 4 },
  { id: "nikah", label: "Nikah", order: 5 },
  { id: "nisan", label: "Nişan", order: 6 },
  { id: "salon", label: "Salon / Düğün", order: 7 },
] as const;

/** Drone hediyesi: dış çekim foto + video + albüm */
export const DRONE_GIFT_OCCASION_ID = "dis-cekim";

export type OccasionId = (typeof OCCASIONS)[number]["id"];

export const occasionLabels: Record<string, string> = Object.fromEntries(
  OCCASIONS.map((o) => [o.id, o.label])
);

export function getOccasionLabel(id?: string): string {
  if (!id) return "Diğer";
  return occasionLabels[id] ?? id;
}
