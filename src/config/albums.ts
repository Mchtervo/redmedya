/** Büyük albüm (sayfa seçimli) — aile albümü için zorunlu ön koşul */
export const BUYUK_ALBUM_ID = "buyuk-album";
export const AILE_ALBUM_ID = "aile-albumu";

export type BuyukAlbumPages = 10 | 20;

export function buyukAlbumSheets(pages: BuyukAlbumPages): number {
  return pages === 20 ? 10 : 5;
}

/** Paket / admin seçenek metni: örn. "5 yaprak 10 sayfa" */
export function buyukAlbumPageOptionLabel(pages: BuyukAlbumPages): string {
  return `${buyukAlbumSheets(pages)} yaprak ${pages} sayfa`;
}

export const BUYUK_ALBUM_PRODUCT_DESCRIPTION =
  "30×60 cm · 5 yaprak (10 sayfa) veya 10 yaprak (20 sayfa) · lüks A kalite baskı";

export function buyukAlbumFullLineLabel(pages: BuyukAlbumPages): string {
  return `Büyük Albüm (${buyukAlbumPageOptionLabel(pages)})`;
}
