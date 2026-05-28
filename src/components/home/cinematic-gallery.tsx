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
    <section id="galeri" className="section-light relative overflow-hidden py-20 md:py-28">
      <div className="section-container relative">
        <SectionReveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne-dark uppercase">
              Gerçek çekimlerimizden bir seçki
            </p>
            <h2 className="mt-4 font-editorial text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] text-rm-black">
              <span className="font-display tabular-nums text-rm-champagne-dark">1000+</span>{" "}
              çiftimizle ömür boyu{" "}
              <span className="italic">yaşayan anılar</span>
            </h2>
          </div>
        </SectionReveal>

        {/* Mobil: 5 önizleme */}
        <div className="mt-10 columns-2 gap-2 px-1 md:hidden">
          {mobilePreview.map((item, i) => (
            <MobilePreviewImage key={item.id} item={item} index={i} />
          ))}
        </div>
        <div className="mt-6 md:hidden">
          <Link
            href="/galeri"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-rm-champagne py-4 text-xs font-bold tracking-[0.2em] text-rm-black uppercase shadow-[0_8px_30px_rgba(196,160,82,0.25)] transition-all active:scale-95"
          >
            Tümünü gör
            <span className="text-rm-black/60">({galleryItems.length})</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Masaüstü: tam boy slayt */}
      <div className="mt-12 hidden md:mt-14 md:block">
        <div className="mx-auto w-full max-w-[1600px] px-4 md:px-8">
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
