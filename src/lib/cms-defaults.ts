import type { SiteCmsConfig, ServiceItem } from "@/types/cms";
import { OCCASIONS } from "@/config/occasions";
import {
  CAMPAIGN_KLIP_LIST_PRICE,
  CAMPAIGN_KLIP_PRICE,
  CAMPAIGN_KLIP_SAVINGS,
  KLIP_GELIN_ALMA_ID,
  KLIP_SALON_GIRIS_ID,
  KLIP_KUAFOR_HAZIRLIK_ID,
} from "@/config/campaign-klips";

const FOTO_PRICE = 5000;
const VIDEO_PRICE = 5000;
const DRONE_PRICE = 4000;
const OMUZ_KAMERA_PRICE = 6500;

const foto = (
  occasion: string,
  label: string,
  sortOrder: number,
  extra?: Partial<ServiceItem>
): ServiceItem => ({
  id: `foto-${occasion}`,
  slug: `foto-${occasion}`,
  name: `Fotoğraf — ${label}`,
  description: "Poz sınırı yok · o etkinliğe ait tüm kareler teslim",
  price: FOTO_PRICE,
  category: "foto",
  occasion,
  sortOrder,
  isActive: true,
  ...extra,
});

const videoKlip = (
  occasion: string,
  label: string,
  sortOrder: number,
  extra?: Partial<ServiceItem>
): ServiceItem => ({
  id: `video-${occasion}`,
  slug: `video-${occasion}`,
  name: `Video Klip — ${label}`,
  description: "Sinematik kurgu · o etkinliğe özel klip teslimi",
  price: VIDEO_PRICE,
  category: "video",
  occasion,
  sortOrder,
  isActive: true,
  ...extra,
});

const droneExtra = (
  occasion: string,
  label: string,
  sortOrder: number,
  extra?: Partial<ServiceItem>
): ServiceItem => ({
  id: `drone-${occasion}`,
  slug: `drone-${occasion}`,
  name: `Drone — ${label}`,
  description: "Havadan sinematik görüntüler · o etkinliğe özel drone çekimi",
  price: DRONE_PRICE,
  category: "extra",
  occasion,
  sortOrder,
  isActive: true,
  ...extra,
});

const omuzExtra = (
  occasion: string,
  label: string,
  sortOrder: number,
  extra?: Partial<ServiceItem>
): ServiceItem => ({
  id: `omuz-${occasion}`,
  slug: `omuz-${occasion}`,
  name: `Omuz Kamerası — ${label}`,
  description:
    "O etkinliğe özel omuz kamera video çekimi · baştan sona ham ve kurgulu teslim",
  price: OMUZ_KAMERA_PRICE,
  category: "video",
  occasion,
  sortOrder,
  isActive: true,
  ...extra,
});

function buildOccasionServices(): ServiceItem[] {
  const items: ServiceItem[] = [];
  for (const o of OCCASIONS) {
    const order = o.order;
    items.push(
      foto(o.id, o.label, order, {
        ...(o.id === "dis-cekim"
          ? {
              badge: "most-chosen",
              isPopular: true,
              recommendation: "En çok tercih edilen dış mekân çekimi.",
            }
          : o.id === "gelin-alma"
            ? { isPopular: true }
            : {}),
      }),
      videoKlip(
        o.id,
        o.label,
        order + 10,
        o.id === "dis-cekim"
          ? {
              badge: "popular",
              upsellHint: "Dış çekim foto + video + albüm ile drone hediye",
            }
          : o.id === "salon"
            ? {
                name: "Sinematik Klip Çekimi",
                description:
                  "Düğün başından pasta kesiminin bitimine kadar · salon girişinden özel sinematik klip çekimi ve kurgu",
                price: 10000,
                badge: "best-value",
                isPopular: true,
              }
            : {}
      ),
      droneExtra(
        o.id,
        o.label,
        order + 20,
        o.id === "dis-cekim"
          ? {
              upsellHint:
                "Dış çekim foto + video + albüm seçildiğinde ücretsiz hediye",
            }
          : {}
      )
    );
    if (o.id !== "dis-cekim") {
      items.push(omuzExtra(o.id, o.label, order + 25));
    }
  }
  return items;
}

function buildCampaignKlipServices(): ServiceItem[] {
  return [
    {
      id: KLIP_GELIN_ALMA_ID,
      slug: KLIP_GELIN_ALMA_ID,
      name: "Gelin Alma Merasimi Klip Çekimi",
      description:
        "Gelin alma anının sinematik klip çekimi ve kurgusu · merasim boyunca özel kurgu",
      price: CAMPAIGN_KLIP_LIST_PRICE,
      campaignPrice: CAMPAIGN_KLIP_PRICE,
      excludeFromBundleDiscount: true,
      category: "video",
      occasion: "gelin-alma",
      sortOrder: 15,
      isActive: true,
      badge: "popular",
      isPopular: true,
      upsellHint: `Dış çekim veya foto+video+albüm paketinde kampanyayla ${CAMPAIGN_KLIP_PRICE.toLocaleString("tr-TR")}₺`,
    },
    {
      id: KLIP_SALON_GIRIS_ID,
      slug: KLIP_SALON_GIRIS_ID,
      name: "Salon Girişi & İlk Dans Klip Çekimi",
      description:
        "Salon girişi ve ilk dans anlarının sinematik klip çekimi ve kurgusu",
      price: CAMPAIGN_KLIP_LIST_PRICE,
      campaignPrice: CAMPAIGN_KLIP_PRICE,
      excludeFromBundleDiscount: true,
      category: "video",
      occasion: "salon",
      sortOrder: 16,
      isActive: true,
      badge: "most-chosen",
      isPopular: true,
      upsellHint: `Size özel kampanya — şimdi ekle ${CAMPAIGN_KLIP_PRICE.toLocaleString("tr-TR")}₺ · ${CAMPAIGN_KLIP_SAVINGS.toLocaleString("tr-TR")}₺ kara gir`,
    },
    {
      id: KLIP_KUAFOR_HAZIRLIK_ID,
      slug: KLIP_KUAFOR_HAZIRLIK_ID,
      name: "Kuaför & Hazırlık Klip Çekimi",
      description:
        "Kuaför ve hazırlık anlarının sinematik klip çekimi ve kurgusu",
      price: CAMPAIGN_KLIP_LIST_PRICE,
      campaignPrice: CAMPAIGN_KLIP_PRICE,
      excludeFromBundleDiscount: true,
      category: "video",
      occasion: "kuafor-hazirlik",
      sortOrder: 17,
      isActive: true,
      isPopular: true,
      upsellHint: `Kampanyayla ${CAMPAIGN_KLIP_PRICE.toLocaleString("tr-TR")}₺ · ${CAMPAIGN_KLIP_SAVINGS.toLocaleString("tr-TR")}₺ kara gir`,
    },
  ];
}

/** Varsayılan site içeriği — admin panelden güncellenir */
export function getDefaultCmsConfig(): SiteCmsConfig {
  return {
    updatedAt: new Date().toISOString(),
    campaign: {
      active: true,
      message: "Tüm paketlerde %20 indirim · Dış çekim Foto+Video+Albüm = Drone hediye",
      ctaLabel: "Paket oluştur",
      ctaHref: "/paket-olustur",
    },
    bundleDiscounts: [
      {
        minServices: 1,
        percent: 20,
        message: "Tüm paketlerde %20 indirim",
      },
    ],
    coupons: [
      {
        id: "c-red2026",
        code: "RED2026",
        type: "PERCENTAGE",
        value: 10,
        isActive: true,
        description: "Erken rezervasyon %10",
      },
      {
        id: "c-vip5000",
        code: "VIP5000",
        type: "FIXED",
        value: 5000,
        isActive: true,
        description: "5.000₺ sabit indirim",
      },
    ],
    services: [
      ...buildOccasionServices(),
      ...buildCampaignKlipServices(),
      {
        id: "buyuk-album",
        slug: "buyuk-album",
        name: "Büyük Albüm",
        description: "30×60 cm · 5 yaprak (10 sayfa) veya 10 yaprak (20 sayfa) · lüks A kalite baskı",
        price: 2500,
        category: "album",
        pricingType: "pages",
        pageOptions: [10, 20],
        sortOrder: 90,
        isActive: true,
      },
      {
        id: "aile-albumu",
        slug: "aile-albumu",
        name: "Aile Albümü",
        description: "İsteğe bağlı · adet başına lüks mini albüm",
        price: 0,
        category: "album",
        pricingType: "quantity",
        unitPrice: 1000,
        maxQuantity: 2,
        sortOrder: 91,
        isActive: true,
      },
      {
        id: "canvas-50x70",
        slug: "canvas-50x70",
        name: "Canvas Tablo 50×70 cm",
        description: "Premium canvas baskı",
        price: 1000,
        category: "album",
        sortOrder: 92,
        isActive: true,
      },
      {
        id: "canvas-70x100",
        slug: "canvas-70x100",
        name: "Canvas Tablo 70×100 cm",
        description: "Büyük format canvas",
        price: 1500,
        category: "album",
        sortOrder: 93,
        isActive: true,
      },
    ],
  };
}
