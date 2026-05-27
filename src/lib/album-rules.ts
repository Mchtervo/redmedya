import { BUYUK_ALBUM_ID, AILE_ALBUM_ID } from "@/config/albums";

export { BUYUK_ALBUM_ID, AILE_ALBUM_ID };

export function hasBuyukAlbumSelected(
  selectedIds: string[],
  services: { id: string; pricingType?: string }[]
): boolean {
  if (selectedIds.includes(BUYUK_ALBUM_ID)) return true;
  return services.some(
    (s) => s.pricingType === "pages" && selectedIds.includes(s.id)
  );
}

export function canAddAileAlbum(
  selectedIds: string[],
  services: { id: string; pricingType?: string }[]
): boolean {
  return hasBuyukAlbumSelected(selectedIds, services);
}
