import { BUYUK_ALBUM_ID, AILE_ALBUM_ID, hasBuyukAlbumSelected } from "@/lib/album-rules";
import { KLIP_GELIN_ALMA_ID } from "@/config/campaign-klips";
import {
  DRONE_GIFT_SERVICE_ID,
  FOTO_DIS_CEKIM_ID,
  VIDEO_DIS_CEKIM_ID,
  qualifiesForDroneGift,
} from "@/lib/package-pricing";
import type { ServiceItem } from "@/types/cms";

export const DRONE_GIFT_LIST_VALUE = 4000;
export const FOTO_GELIN_ALMA_ID = "foto-gelin-alma";

const SESSION_DISMISS_KEY = "rm-drone-bundle-offer-dismiss";

export function isDroneBundleOfferDismissed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(SESSION_DISMISS_KEY) === "1";
}

export function dismissDroneBundleOffer(): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_DISMISS_KEY, "1");
}

/** Dış çekim foto+video var, albümler eksik → drone hediye kartı göster */
export function shouldShowDroneBundleOffer(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): boolean {
  if (isDroneBundleOfferDismissed()) return false;

  const hasDisFoto = selectedIds.includes(FOTO_DIS_CEKIM_ID);
  const hasDisVideo = selectedIds.includes(VIDEO_DIS_CEKIM_ID);
  if (!hasDisFoto || !hasDisVideo) return false;

  if (qualifiesForDroneGift(services, selectedIds, serviceQuantities)) {
    return false;
  }

  return true;
}

export function droneBundleOfferProgress(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
) {
  const hasBuyuk = hasBuyukAlbumSelected(selectedIds, services);
  const aileQty = serviceQuantities[AILE_ALBUM_ID] ?? 0;
  const hasDrone = selectedIds.includes(DRONE_GIFT_SERVICE_ID);

  return {
    hasBuyuk,
    aileQty,
    needsBuyuk: !hasBuyuk,
    needsAile: aileQty < 2,
    hasDrone,
    complete: qualifiesForDroneGift(services, selectedIds, serviceQuantities),
  };
}

export function canUpsellGelinAlmaInBundle(selectedIds: string[]): boolean {
  return (
    !selectedIds.includes(FOTO_GELIN_ALMA_ID) &&
    !selectedIds.includes(KLIP_GELIN_ALMA_ID)
  );
}
