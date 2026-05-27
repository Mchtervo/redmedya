export type GalleryItem = {
  id: string;
  couple: string;
  venue: string;
  tag: string;
  image: string;
  aspect: "tall" | "wide" | "square";
};

const tags = [
  "Cinematic Film",
  "Dış Çekim",
  "Düğün Hikayesi",
  "Editorial",
  "Golden Hour",
  "Platoda",
  "Kına & Nikah",
  "Drone",
  "Same Day Edit",
  "Albüm",
] as const;

const venues = [
  "Ankara",
  "Kapadokya",
  "Ulus · Ankara",
  "Kır Bahçesi",
  "Green Park",
  "Plato Studio",
  "Özel Mekan",
  "Bahçe Düğünü",
  "Müze · Ankara",
  "Serasera Villa",
] as const;

const aspects: GalleryItem["aspect"][] = ["tall", "wide", "square"];

/** 49 gerçek REDMEDYA çekimi — public/gallery/01–49.png */
export const galleryItems: GalleryItem[] = Array.from({ length: 49 }, (_, i) => {
  const num = String(i + 1).padStart(2, "0");
  return {
    id: String(i + 1),
    couple: tags[i % tags.length],
    venue: venues[i % venues.length],
    tag: "REDMEDYA",
    image: `/gallery/${num}.png`,
    aspect: aspects[i % aspects.length],
  };
});
