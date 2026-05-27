"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionReveal } from "@/components/effects/section-reveal";
import { GallerySlider } from "@/components/gallery/gallery-slider";
import { GalleryLightbox } from "@/components/gallery/gallery-lightbox";
import { galleryItems } from "@/config/gallery";

const MOBILE_PREVIEW_COUNT = 5;

function MobilePreviewImage({
  item,
  index,
}: {
  item: (typeof galleryItems)[0];
  index: number;
}) {
  return (
    <Link
      href="/galeri"
      className="group mb-2 block break-inside-avoid overflow-hidden rounded-sm"
    >
      <Image
        src={item.image}
        alt={item.couple}
        width={400}
        height={index % 3 === 0 ? 500 : index % 3 === 1 ? 350 : 450}
        className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        sizes="50vw"
        loading="lazy"
        fetchPriority={index < 2 ? "high" : "low"}
      />
    </Link>
  );
}

export function CinematicGallery() {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const mobilePreview = galleryItems.slice(0, MOBILE_PREVIEW_COUNT);

  return (
    <section id="galeri" className="section-light section-padding relative overflow-hidden">
      <div className="section-container relative">
        <SectionReveal>
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-rm-champagne-dark uppercase">
              Gerçek çekimlerimizden bir seçki
            </p>
            <h2 className="mt-4 font-display text-2xl text-rm-black md:text-5xl">
              1000+ çiftimizle ömür boyu yaşayan anılar
            </h2>
            <p className="mx-auto mt-4 hidden max-w-xl text-sm text-rm-gray-400 md:block">
              2 saniyede otomatik geçiş · sol/sağ oklar
            </p>
          </div>
        </SectionReveal>

        {/* Mobil: 5 önizleme */}
        <div className="mt-8 columns-2 gap-2 px-1 md:hidden">
          {mobilePreview.map((item, i) => (
            <MobilePreviewImage key={item.id} item={item} index={i} />
          ))}
        </div>
        <div className="mt-8 md:hidden">
          <Link
            href="/galeri"
            className="flex w-full items-center justify-center gap-2 bg-rm-champagne py-4 text-xs font-bold tracking-[0.15em] text-rm-black uppercase transition-opacity active:opacity-90"
          >
            Devamını gör
            <span className="text-rm-black/60">({galleryItems.length} fotoğraf)</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Masaüstü: slayt */}
        <div className="mt-12 hidden md:mt-16 md:block">
          <GallerySlider
            onImageClick={setLightboxIndex}
            showViewAll
          />
        </div>
      </div>

      <GalleryLightbox
        item={lightboxIndex !== null ? galleryItems[lightboxIndex] : null}
        index={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
        onChangeIndex={setLightboxIndex}
      />
    </section>
  );
}
