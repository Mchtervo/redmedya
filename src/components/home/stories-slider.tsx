"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, MapPin, Quote } from "lucide-react";

const stories = [
  {
    id: "1",
    title: "Elif & Burak",
    venue: "JW Marriott Ankara",
    quote: "Hayatımızın en güzel gününü ölümsüzleştirdiler.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80",
  },
  {
    id: "2",
    title: "Zeynep & Emre",
    venue: "Green Park Hotel",
    quote: "Filmlerimizi izlerken her seferinde ağlıyoruz.",
    image: "https://images.unsplash.com/photo-1465495976277-aa7dcbcdcafe?w=800&q=80",
  },
  {
    id: "3",
    title: "Ayşe & Can",
    venue: "Ankara Palas",
    quote: "Profesyonellik ve samimiyet bir arada.",
    image: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800&q=80",
  },
  {
    id: "4",
    title: "Selin & Mert",
    venue: "Hilton Ankara",
    quote: "Reels videolarımız viral oldu!",
    image: "https://images.unsplash.com/photo-1522673607200-83623ebb0c2b?w=800&q=80",
  },
];

export function StoriesSlider() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.85;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-padding overflow-hidden">
      <div className="section-container mb-10 flex items-end justify-between">
        <div>
          <p className="text-xs tracking-[0.3em] text-rm-champagne uppercase">Hikayeler</p>
          <h2 className="mt-2 font-[family-name:var(--font-cormorant)] text-4xl font-light md:text-5xl">
            Çift Hikayeleri
          </h2>
        </div>
        <div className="hidden gap-2 sm:flex">
          <button
            type="button"
            onClick={() => scroll("left")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-rm-champagne"
            aria-label="Önceki"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => scroll("right")}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 transition-colors hover:border-rm-champagne"
            aria-label="Sonraki"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="no-scrollbar flex gap-5 overflow-x-auto px-[var(--container-px)] pb-4 snap-x snap-mandatory"
      >
        {stories.map((story, i) => (
          <motion.article
            key={story.id}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="group relative w-[min(85vw,380px)] shrink-0 snap-center overflow-hidden rounded-xl"
          >
            <div className="relative aspect-[3/4] overflow-hidden">
              <Image
                src={story.image}
                alt={story.title}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
                sizes="380px"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-rm-black via-rm-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-rm-champagne/50 bg-rm-black/50 backdrop-blur-sm">
                  <span className="text-xs tracking-widest text-rm-champagne uppercase">
                    İzle
                  </span>
                </div>
              </div>
            </div>
            <div className="absolute right-0 bottom-0 left-0 p-6">
              <h3 className="font-[family-name:var(--font-cormorant)] text-2xl text-rm-off-white">
                {story.title}
              </h3>
              <p className="mt-1 flex items-center gap-1 text-xs text-rm-gray-300">
                <MapPin size={12} />
                {story.venue}
              </p>
              <p className="mt-3 flex gap-2 text-sm text-rm-gray-200 italic">
                <Quote size={14} className="shrink-0 text-rm-champagne" />
                {story.quote}
              </p>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
