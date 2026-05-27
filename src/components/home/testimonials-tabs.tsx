"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { EASE_LUXURY } from "@/lib/animations";

const tabs = ["Mutlu Çiftlerimiz", "Google Yorumları"] as const;

const couples = [
  {
    name: "Elif & Burak",
    text: "Filmlerimizi izlerken her seferinde ağlıyoruz. Profesyonellik ve samimiyet bir arada.",
    image: "/gallery/03.png",
  },
  {
    name: "Zeynep & Emre",
    text: "Reels paketimiz viral oldu. Ankara'da araştırdığımız en iyi ekip.",
    image: "/gallery/15.png",
  },
  {
    name: "Ayşe & Can",
    text: "Drone çekimleri inanılmaz. Paket oluşturucu süreci çok şeffaftı.",
    image: "/gallery/22.png",
  },
  {
    name: "Selin & Mert",
    text: "Same day edit ile salonda herkes büyülendi. Kesinlikle tavsiye.",
    image: "/gallery/41.png",
  },
];

const google = [
  { name: "Hande E.", text: "Poz verme konusunda çok yönlendirildik, sonuçlara inanamadık.", rating: 5 },
  { name: "Merve K.", text: "İyi ki REDMEDYA'yı seçmişiz. Bakmaya doyamıyoruz.", rating: 5 },
  { name: "Fatma D.", text: "O gün öyle eğlendik ki düğün stresinden uzaklaştık.", rating: 5 },
];

export function TestimonialsTabs() {
  const [tab, setTab] = useState<(typeof tabs)[number]>("Mutlu Çiftlerimiz");
  const [index, setIndex] = useState(0);

  const isCouples = tab === "Mutlu Çiftlerimiz";
  const list = isCouples ? couples : google;
  const current = list[index % list.length];

  return (
    <section id="yorumlar" className="section-dark py-16 md:py-24">
      <div className="section-container">
        <div className="text-center">
          <h2 className="font-display text-3xl text-rm-off-white md:text-4xl">
            Her ilişkinin eşsizliği kendisine özel
          </h2>
        </div>

        <div className="mt-10 flex justify-center gap-2">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => {
                setTab(t);
                setIndex(0);
              }}
              className={`rounded-full px-6 py-2.5 text-xs font-semibold tracking-wide uppercase transition-colors ${
                tab === t
                  ? "bg-rm-champagne text-rm-black"
                  : "border border-white/15 text-rm-gray-400 hover:text-rm-off-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-12 max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: EASE_LUXURY }}
              className="grid items-center gap-8 md:grid-cols-[200px_1fr]"
            >
              {isCouples && "image" in current && (
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[200px] overflow-hidden rounded-lg">
                  <Image
                    src={(current as (typeof couples)[0]).image}
                    alt={current.name}
                    fill
                    className="object-cover"
                    sizes="200px"
                  />
                </div>
              )}
              <div className="text-center md:text-left">
                <Quote className="mx-auto h-8 w-8 text-rm-champagne/50 md:mx-0" />
                <p className="mt-4 text-lg leading-relaxed text-rm-gray-200 md:text-xl">
                  &ldquo;{current.text}&rdquo;
                </p>
                <p className="mt-6 font-display text-2xl text-rm-champagne">{current.name}</p>
                {!isCouples && (
                  <p className="mt-1 text-xs text-rm-gray-500">Google Yorum</p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)}
            className="absolute top-1/2 -left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-rm-black-elevated md:-left-14"
            aria-label="Önceki"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % list.length)}
            className="absolute top-1/2 -right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-rm-black-elevated md:-right-14"
            aria-label="Sonraki"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  );
}
