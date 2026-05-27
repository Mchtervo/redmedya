"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { galleryItems } from "@/config/gallery";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { EASE_LUXURY } from "@/lib/animations";

export function GalleryGrid() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
        {galleryItems.map((item, i) => (
          <motion.button
            key={item.id}
            type="button"
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-20px" }}
            transition={{ delay: Math.min(i * 0.02, 0.4), duration: 0.5, ease: EASE_LUXURY }}
            onClick={() => setLightboxIndex(i)}
            className="group relative aspect-[3/4] overflow-hidden rounded-sm bg-rm-black-elevated"
          >
            <Image
              src={item.image}
              alt={item.couple}
              fill
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              loading={i < 8 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rm-black/80 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <div className="absolute right-2 bottom-2 left-2 text-left opacity-0 transition-opacity group-hover:opacity-100">
              <p className="text-[10px] font-medium text-rm-off-white line-clamp-1">
                {item.couple}
              </p>
              <p className="text-[9px] text-rm-gray-400">{item.venue}</p>
            </div>
            <span className="absolute top-2 left-2 rounded bg-rm-black/60 px-1.5 py-0.5 text-[9px] tabular-nums text-rm-champagne backdrop-blur-sm">
              {i + 1}
            </span>
          </motion.button>
        ))}
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
