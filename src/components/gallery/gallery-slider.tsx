"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { galleryItems } from "@/config/gallery";
import { EASE_LUXURY } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const INTERVAL_MS = 2000;
const SWIPE_THRESHOLD = 50;

type GallerySliderProps = {
  onImageClick?: (index: number) => void;
  showViewAll?: boolean;
  className?: string;
};

export function GallerySlider({
  onImageClick,
  showViewAll = true,
  className,
}: GallerySliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef<number | null>(null);
  const reduced = useReducedMotion();
  const total = galleryItems.length;
  const current = galleryItems[index];

  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % total) + total) % total);
    },
    [total]
  );

  const goPrev = () => goTo(index - 1);
  const goNext = () => goTo(index + 1);

  useEffect(() => {
    if (paused || reduced) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % total);
    }, INTERVAL_MS);
    return () => clearInterval(timer);
  }, [paused, reduced, total]);

  const handleTouchStart = (x: number) => {
    touchStart.current = x;
  };

  const handleTouchEnd = (x: number) => {
    if (touchStart.current === null) return;
    const diff = touchStart.current - x;
    if (Math.abs(diff) > SWIPE_THRESHOLD) {
      if (diff > 0) goNext();
      else goPrev();
    }
    touchStart.current = null;
  };

  return (
    <div
      className={cn("relative", className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div
        className="relative aspect-[4/5] w-full overflow-hidden rounded-sm md:aspect-[21/9] md:max-h-[70vh]"
        onTouchStart={(e) => handleTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={current.id}
            type="button"
            className="absolute inset-0 h-full w-full cursor-pointer"
            onClick={() => onImageClick?.(index)}
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -80 }}
            transition={{ duration: 0.55, ease: EASE_LUXURY }}
            aria-label={`${current.couple} — büyüt`}
          >
            <Image
              src={current.image}
              alt={current.couple}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 1280px"
              priority={index < 2}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rm-black/90 via-rm-black/20 to-rm-black/30" />
            <div className="absolute right-0 bottom-0 left-0 p-6 md:p-10">
              <span className="rounded-full border border-rm-champagne/30 bg-rm-black/40 px-3 py-1 text-[9px] tracking-[0.2em] text-rm-champagne uppercase backdrop-blur-md">
                {current.tag}
              </span>
              <p className="mt-4 font-display text-2xl text-rm-off-white md:text-4xl">
                {current.couple}
              </p>
              <p className="mt-1 text-sm text-rm-gray-300">{current.venue}</p>
            </div>
          </motion.button>
        </AnimatePresence>

        {/* Sol ok */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goPrev();
          }}
          className="absolute top-1/2 left-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full glass-premium transition-transform hover:scale-105 active:scale-95 md:left-6 md:h-14 md:w-14"
          aria-label="Önceki fotoğraf"
        >
          <ChevronLeft className="h-6 w-6 text-rm-champagne" />
        </button>

        {/* Sağ ok */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            goNext();
          }}
          className="absolute top-1/2 right-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full glass-premium transition-transform hover:scale-105 active:scale-95 md:right-6 md:h-14 md:w-14"
          aria-label="Sonraki fotoğraf"
        >
          <ChevronRight className="h-6 w-6 text-rm-champagne" />
        </button>
      </div>

      {/* Sayaç + noktalar (mobilde sadece sayaç) */}
      <div className="mt-5 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm tabular-nums text-rm-gray-400">
          <span className="text-rm-champagne">{index + 1}</span>
          <span className="mx-1">/</span>
          {total}
          {!paused && !reduced && (
            <span className="ml-2 text-[10px] tracking-wider text-rm-gray-500 uppercase">
              · 2sn otomatik
            </span>
          )}
        </p>

        <div className="hidden max-w-md flex-1 gap-1.5 overflow-hidden md:flex">
          {galleryItems.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i === index ? "bg-rm-champagne" : "bg-white/15 hover:bg-white/30"
              )}
              aria-label={`Fotoğraf ${i + 1}`}
            />
          ))}
        </div>

        {showViewAll && (
          <Link
            href="/galeri"
            className="inline-flex items-center gap-2 text-xs tracking-[0.15em] text-rm-champagne uppercase transition-opacity hover:opacity-80"
          >
            Tümünü incele
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
