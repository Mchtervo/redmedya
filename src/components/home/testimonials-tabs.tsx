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
    <section id="yorumlar" className="section-dark py-20 md:py-28">
      <div className="section-container">
        <div className="text-center">
          <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
            Mutlu çiftlerimiz
          </p>
          <h2 className="mx-auto mt-4 max-w-2xl font-editorial text-[clamp(1.75rem,4vw,3rem)] leading-[1.05] text-rm-off-white">
            Her ilişkinin eşsizliği{" "}
            <span className="italic text-rm-champagne-light">kendisine özel</span>
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
              className={`rounded-full px-5 py-2 text-[10px] font-semibold tracking-[0.2em] uppercase transition-all ${
                tab === t
                  ? "bg-rm-champagne text-rm-black shadow-[0_4px_20px_rgba(196,160,82,0.25)]"
                  : "border border-white/15 text-rm-gray-400 hover:border-white/30 hover:text-rm-off-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="relative mx-auto mt-14 max-w-4xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${tab}-${index}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.45, ease: EASE_LUXURY }}
              className="grid items-center gap-6 rounded-3xl border border-white/8 bg-rm-black-elevated/40 p-5 backdrop-blur-sm sm:gap-10 sm:p-8 md:grid-cols-[220px_1fr] md:p-12"
            >
              {isCouples && "image" in current && (
                <div className="relative mx-auto aspect-[3/4] w-full max-w-[180px] overflow-hidden rounded-2xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] sm:max-w-[220px]">
                  <Image
                    src={(current as (typeof couples)[0]).image}
                    alt={current.name}
                    fill
                    className="object-cover"
                    sizes="(max-width:640px) 180px, 220px"
                  />
                </div>
              )}
              <div className="text-center md:text-left">
                <Quote className="mx-auto h-7 w-7 text-rm-champagne/40 sm:h-9 sm:w-9 md:mx-0" />
                <p className="mt-4 font-editorial text-lg leading-relaxed text-rm-off-white sm:mt-5 sm:text-xl md:text-2xl">
                  &ldquo;{current.text}&rdquo;
                </p>
                <div className="mt-5 flex items-center justify-center gap-3 sm:mt-7 md:justify-start">
                  <div className="h-px w-8 bg-rm-champagne" />
                  <p className="text-sm font-semibold tracking-wider text-rm-champagne uppercase">
                    {current.name}
                  </p>
                </div>
                {!isCouples && (
                  <p className="mt-1.5 text-[10px] tracking-[0.2em] text-rm-gray-500 uppercase">
                    Google Yorumu
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <button
            type="button"
            onClick={() => setIndex((i) => (i - 1 + list.length) % list.length)}
            className="absolute top-1/2 left-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-rm-black-elevated/85 text-rm-off-white backdrop-blur-sm transition-all hover:border-rm-champagne/40 hover:bg-rm-champagne/10 sm:left-3 sm:h-11 sm:w-11 md:-left-16"
            aria-label="Önceki"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setIndex((i) => (i + 1) % list.length)}
            className="absolute top-1/2 right-2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-rm-black-elevated/85 text-rm-off-white backdrop-blur-sm transition-all hover:border-rm-champagne/40 hover:bg-rm-champagne/10 sm:right-3 sm:h-11 sm:w-11 md:-right-16"
            aria-label="Sonraki"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex justify-center gap-1.5">
            {list.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`Yorum ${i + 1}`}
                className={`h-1 rounded-full transition-all ${
                  i === index % list.length
                    ? "w-8 bg-rm-champagne"
                    : "w-1.5 bg-white/20 hover:bg-white/40"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
