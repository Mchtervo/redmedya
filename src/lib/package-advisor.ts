import {
  FOTO_DIS_CEKIM_ID,
  VIDEO_DIS_CEKIM_ID,
} from "@/lib/package-pricing";
import {
  KLIP_GELIN_ALMA_ID,
  KLIP_SALON_GIRIS_ID,
  isCampaignKlipId,
} from "@/config/campaign-klips";
import { isServiceSelected } from "@/lib/package-pricing";
import type { ServiceItem } from "@/types/cms";

/** Sepet özeti — “neden bu paket?” tek cümle */
export function getPackageAdvisorMessage(
  services: ServiceItem[],
  selectedIds: string[],
  serviceQuantities: Record<string, number>
): string | null {
  if (selectedIds.length === 0) {
    return "Çoğu Ankara çifti pakete dış çekim foto + video ile başlıyor; ardından gelin alma ve salon klip ekliyor.";
  }

  const hasDisFoto = selectedIds.includes(FOTO_DIS_CEKIM_ID);
  const hasDisVideo = selectedIds.includes(VIDEO_DIS_CEKIM_ID);
  const hasGelinKlip = selectedIds.includes(KLIP_GELIN_ALMA_ID);
  const hasSalonKlip = selectedIds.includes(KLIP_SALON_GIRIS_ID);
  const hasAlbum = services.some(
    (s) =>
      s.category === "album" &&
      isServiceSelected(s, selectedIds, serviceQuantities)
  );

  if (hasDisFoto && hasDisVideo && !hasGelinKlip && !hasSalonKlip) {
    return "Harika başlangıç — Ankara’daki çiftlerin çoğu bir sonraki adımda gelin alma veya salon giriş klip kampanyasını ekliyor.";
  }

  if (hasDisFoto && hasDisVideo && hasAlbum && !hasGelinKlip) {
    return "Dış çekim paketiniz tamam — sırada en çok eklenen: gelin alma merasimi klip (kampanyayla 3.500₺).";
  }

  if (hasGelinKlip && !hasSalonKlip) {
    return "Gelin alma klip seçildi — salon girişi & ilk dans klibi de ekleyen çiftler paketi genelde bu şekilde tamamlıyor.";
  }

  if (selectedIds.some((id) => id.startsWith("omuz-")) && !hasSalonKlip) {
    return "Omuz kamera güçlü bir seçim; salon anları için sinematik veya giriş klip ile paketi dengeleyen çiftler memnun kalıyor.";
  }

  const mediaCount = selectedIds.filter(
    (id) =>
      id.startsWith("foto-") ||
      id.startsWith("video-") ||
      id.startsWith("klip-") ||
      id.startsWith("omuz-")
  ).length;

  if (mediaCount >= 4 && !hasAlbum) {
    return "Birden fazla çekim seçtiniz — albüm ekleyen çiftlerde dış çekim drone hediye oluyor.";
  }

  if (selectedIds.some(isCampaignKlipId)) {
    return "Kampanya klipleriniz sepette — paket %20 indirimi bu kalemlere uygulanmaz, avantaj zaten özel fiyatta.";
  }

  return "Seçiminiz Ankara’daki popüler paket kombinasyonlarına yakın — eksik gördüğünüz töreni soldan ekleyebilirsiniz.";
}
