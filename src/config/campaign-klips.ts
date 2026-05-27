/** Özel kampanya klipleri — liste 5.000₺, kampanya butonu 3.500₺, paket %20’sine dahil değil */
export const KLIP_GELIN_ALMA_ID = "klip-gelin-alma";
export const KLIP_SALON_GIRIS_ID = "klip-salon-giris";
export const KLIP_KUAFOR_HAZIRLIK_ID = "klip-kuafor-hazirlik";

export const CAMPAIGN_KLIP_IDS = [
  KLIP_GELIN_ALMA_ID,
  KLIP_SALON_GIRIS_ID,
  KLIP_KUAFOR_HAZIRLIK_ID,
] as const;

export type CampaignKlipId = (typeof CAMPAIGN_KLIP_IDS)[number];

export const CAMPAIGN_KLIP_LIST_PRICE = 5000;
export const CAMPAIGN_KLIP_PRICE = 3500;
export const CAMPAIGN_KLIP_SAVINGS = CAMPAIGN_KLIP_LIST_PRICE - CAMPAIGN_KLIP_PRICE;

export function isCampaignKlipId(id: string): id is CampaignKlipId {
  return (CAMPAIGN_KLIP_IDS as readonly string[]).includes(id);
}

/** Kampanya klip seçildiğinde aynı etkinlikteki standart video kartı gösterilmez */
export function standardVideoIdForCampaignKlip(klipId: string): string | null {
  if (!isCampaignKlipId(klipId)) return null;
  return `video-${CAMPAIGN_KLIP_META[klipId].occasionId}`;
}

export const CAMPAIGN_KLIP_META: Record<
  CampaignKlipId,
  { title: string; shortTitle: string; occasionId: string }
> = {
  [KLIP_GELIN_ALMA_ID]: {
    title: "Sinematik Klip — Gelin Alma",
    shortTitle: "Gelin alma sinematik klip",
    occasionId: "gelin-alma",
  },
  [KLIP_SALON_GIRIS_ID]: {
    title: "Salon Girişi & İlk Dans Klip Çekimi",
    shortTitle: "Salon giriş & ilk dans",
    occasionId: "salon",
  },
  [KLIP_KUAFOR_HAZIRLIK_ID]: {
    title: "Kuaför & Hazırlık Klip Çekimi",
    shortTitle: "Kuaför hazırlık klip",
    occasionId: "kuafor-hazirlik",
  },
};
