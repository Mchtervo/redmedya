import {
  CAMPAIGN_KLIP_IDS,
  CAMPAIGN_KLIP_META,
  CAMPAIGN_KLIP_PRICE,
  CAMPAIGN_KLIP_LIST_PRICE,
  CAMPAIGN_KLIP_SAVINGS,
  type CampaignKlipId,
} from "@/config/campaign-klips";
import {
  FOTO_DIS_CEKIM_ID,
  VIDEO_DIS_CEKIM_ID,
  isServiceSelected,
} from "@/lib/package-pricing";
import type { ServiceItem } from "@/types/cms";

export type CampaignKlipOffer = {
  id: string;
  serviceId: CampaignKlipId;
  title: string;
  body: string;
  listPrice: number;
  campaignPrice: number;
  savingsLabel: string;
  scrollId: string;
};

function hasAlbum(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
) {
  return services.some(
    (s) =>
      s.category === "album" &&
      isServiceSelected(s, selectedIds, serviceQuantities)
  );
}

function hasAnyFotoVideo(
  selectedIds: string[],
  serviceQuantities: Record<string, number>
) {
  const hasFoto = selectedIds.some((id) => id.startsWith("foto-"));
  const hasVideo =
    selectedIds.some(
      (id) => id.startsWith("video-") || id.startsWith("klip-")
    ) || false;
  return hasFoto && hasVideo;
}

/** Foto + video (veya sinematik klip) birlikte — kampanya 3.500₺ */
export function qualifiesForKlipCampaign(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): boolean {
  const disPack =
    selectedIds.includes(FOTO_DIS_CEKIM_ID) &&
    selectedIds.includes(VIDEO_DIS_CEKIM_ID);
  if (disPack) return true;
  if (hasAnyFotoVideo(selectedIds, serviceQuantities)) return true;
  return (
    hasAlbum(services, selectedIds, serviceQuantities) &&
    selectedIds.some((id) => id.startsWith("foto-"))
  );
}

export function getCampaignKlipOffers(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): CampaignKlipOffer[] {
  if (!qualifiesForKlipCampaign(services, selectedIds, serviceQuantities)) {
    return [];
  }

  const offers: CampaignKlipOffer[] = [];

  for (const serviceId of CAMPAIGN_KLIP_IDS) {
    if (selectedIds.includes(serviceId)) continue;
    const s = services.find((x) => x.id === serviceId);
    if (!s?.isActive) continue;

    const meta = CAMPAIGN_KLIP_META[serviceId];
    const listPrice = Number(s.price) || CAMPAIGN_KLIP_LIST_PRICE;
    const campaignPrice = Number(s.campaignPrice) || CAMPAIGN_KLIP_PRICE;

    offers.push({
      id: `campaign-${serviceId}`,
      serviceId,
      title: meta.title,
      body:
        serviceId === "klip-gelin-alma"
          ? "Çiftlerin en çok eklediği an — gelin alma merasiminizi sinematik kliple tamamlayın. Bu fiyata paket %20 indirimi uygulanmaz; zaten size özel fiyat."
          : serviceId === "klip-salon-giris"
            ? "Salon girişi ve ilk dansınızı sinematik kliple ölümsüzleştirin. Kampanya fiyatı — ekstra %20 indirim yok, doğrudan avantajlı fiyat."
            : "Kuaför ve hazırlık anlarınızı sinematik kliple kaydedin — kampanya fiyatıyla pakete ekleyin.",
      listPrice,
      campaignPrice,
      savingsLabel: `${CAMPAIGN_KLIP_SAVINGS.toLocaleString("tr-TR")}₺ kara gir`,
      scrollId: meta.occasionId,
    });
  }

  return offers;
}
