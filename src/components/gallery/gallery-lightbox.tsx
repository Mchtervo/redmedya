"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { galleryItems, type GalleryItem } from "@/config/gallery";
import { EASE_LUXURY } from "@/lib/animations";
import { useEffect, useCallback } from "react";

type GalleryLightboxProps = {
  item: GalleryItem | null;
  index: number;
  onClose: () => void;
  onChangeIndex: (index: number) => void;
};

export function GalleryLightbox({
  item,
  index,
  onClose,
  onChangeIndex,
}: GalleryLightboxProps) {
  const total = galleryItems.length;

  const goPrev = useCallback(() => {
    onChangeIndex((index - 1 + total) % total);
  }, [index, total, onChangeIndex]);

  const goNext = useCallback(() => {
    onChangeIndex((index + 1) % total);
  }, [index, total, onChangeIndex]);

  useEffect(() => {
    if (!item) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [item, goPrev, goNext, onClose]);

  const active = item ?? galleryItems[index];

  return (
    <Dialog.Root open={!!item} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-[200] bg-rm-black/96 backdrop-blur-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        </Dialog.Overlay>
        <Dialog.Content asChild>
          <motion.div
            className="fixed inset-0 z-[201] flex items-center justify-center p-4 md:p-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full glass-premium"
              aria-label="Kapat"
            >
              <X size={20} />
            </button>

            <button
              type="button"
              onClick={goPrev}
              className="absolute top-1/2 left-2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full glass-premium transition-colors hover:border-rm-champagne/50 md:left-6 md:h-14 md:w-14"
              aria-label="Önceki"
            >
              <ChevronLeft className="h-6 w-6 text-rm-champagne" />
            </button>

            <button
              type="button"
              onClick={goNext}
              className="absolute top-1/2 right-2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full glass-premium transition-colors hover:border-rm-champagne/50 md:right-6 md:h-14 md:w-14"
              aria-label="Sonraki"
            >
              <ChevronRight className="h-6 w-6 text-rm-champagne" />
            </button>

            <AnimatePresence mode="wait" initial={false}>
              {active && (
                <motion.div
                  key={active.id}
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -40 }}
                  transition={{ duration: 0.45, ease: EASE_LUXURY }}
                  className="relative flex h-[min(85vh,900px)] w-full max-w-5xl flex-col"
                >
                  <div className="relative min-h-0 flex-1 overflow-hidden rounded-sm">
                    <Image
                      src={active.image}
                      alt={active.couple}
                      fill
                      className="object-contain"
                      sizes="100vw"
                      priority
                    />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-4 px-1">
                    <div>
                      <p className="font-display text-2xl text-rm-off-white md:text-3xl">
                        {active.couple}
                      </p>
                      <p className="mt-1 text-sm text-rm-gray-400">{active.venue}</p>
                    </div>
                    <p className="tabular-nums text-sm text-rm-champagne">
                      {index + 1} / {total}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
