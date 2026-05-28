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
        className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.45)] md:aspect-[16/9]"
        onTouchStart={(e) => handleTouchStart(e.touches[0].clientX)}
        onTouchEnd={(e) => handleTouchEnd(e.changedTouches[0].clientX)}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={current.id}
            type="button"
            className="absolute inset-0 h-full w-full cursor-pointer"
            onClick={() => onImageClick?.(index)}
            initial={{ opacity: 0, scale: 1.04 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.7, ease: EASE_LUXURY }}
            aria-label={`${current.couple} — büyüt`}
          >
            <Image
              src={current.image}
              alt={current.couple}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, (max-width:1280px) 100vw, 1600px"
              priority={index < 2}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rm-black/95 via-rm-black/30 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 p-6 md:p-12">
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div className="min-w-0">
                  <span className="rounded-full border border-rm-champagne/40 bg-rm-black/50 px-3 py-1 text-[9px] font-semibold tracking-[0.25em] text-rm-champagne uppercase backdrop-blur-md">
                    {current.tag}
                  </span>
                  <p className="mt-4 font-editorial text-3xl text-rm-off-white md:text-5xl">
                    {current.couple}
                  </p>
                  <p className="mt-1 text-sm tracking-wide text-rm-gray-300">
                    {current.venue}
                  </p>
                </div>
                <p className="hidden font-editorial text-sm tabular-nums text-rm-gray-300 md:block">
                  <span className="text-rm-champagne">{String(index + 1).padStart(2, "0")}</span>
                  <span className="mx-1.5 text-rm-gray-500">/</span>
                  {String(total).padStart(2, "0")}
                </p>
              </div>
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
          className="glass-premium absolute top-1/2 left-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 md:left-6 md:h-14 md:w-14"
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
          className="glass-premium absolute top-1/2 right-3 z-10 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full transition-all hover:scale-105 active:scale-95 md:right-6 md:h-14 md:w-14"
          aria-label="Sonraki fotoğraf"
        >
          <ChevronRight className="h-6 w-6 text-rm-champagne" />
        </button>

        {/* Otomatik geçiş progress bar */}
        {!paused && !reduced && (
          <div className="absolute right-0 bottom-0 left-0 h-0.5 bg-white/10">
            <motion.div
              key={index}
              className="h-full bg-rm-champagne"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: INTERVAL_MS / 1000, ease: "linear" }}
            />
          </div>
        )}
      </div>

      {/* Alt çubuk: nokta navigasyon + tümünü gör */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm tabular-nums text-rm-gray-400 md:hidden">
          <span className="text-rm-champagne-dark">{index + 1}</span>
          <span className="mx-1">/</span>
          {total}
        </p>

        <div className="hidden max-w-2xl flex-1 gap-1 overflow-hidden md:flex">
          {galleryItems.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "h-1 flex-1 rounded-full transition-all",
                i === index
                  ? "bg-rm-champagne-dark"
                  : "bg-rm-black/10 hover:bg-rm-black/25"
              )}
              aria-label={`Fotoğraf ${i + 1}`}
            />
          ))}
        </div>

        {showViewAll && (
          <Link
            href="/galeri"
            className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.2em] text-rm-champagne-dark uppercase transition-colors hover:text-rm-black"
          >
            Tüm galeriyi incele
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}
