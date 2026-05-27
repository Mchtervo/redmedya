"use client";

import { useState } from "react";
import { GallerySlider } from "@/components/gallery/gallery-slider";
import { GalleryGrid } from "@/components/gallery/gallery-grid";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { galleryItems } from "@/config/gallery";

export function GaleriContent() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="mt-10">
        <p className="mb-4 text-[10px] tracking-[0.2em] text-rm-gray-500 uppercase">
          Slayt · 2sn otomatik · sol/sağ ok veya kaydır
        </p>
        <GallerySlider
          showViewAll={false}
          onImageClick={(i) => setLightboxIndex(i)}
        />
      </div>

      <div className="mt-12 md:mt-16">
        <p className="mb-6 text-[10px] tracking-[0.2em] text-rm-gray-500 uppercase">
          Tüm galeri ({galleryItems.length})
        </p>
        <GalleryGrid />
      </div>

      <GalleryLightbox
        item={lightboxIndex !== null ? galleryItems[lightboxIndex] : null}
        index={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </>
  );
}
