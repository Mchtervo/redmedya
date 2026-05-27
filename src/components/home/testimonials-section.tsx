"use client";

import { motion } from "framer-motion";
import { Star } from "lucide-react";

const testimonials = [
  {
    couple: "Elif & Burak",
    text: "Düğün filmimiz tam bir sinema şaheseri. Her karede duygu var.",
    source: "Google",
    rating: 5,
  },
  {
    couple: "Zeynep & Emre",
    text: "Reels paketi ile sosyal medyada binlerce beğeni aldık!",
    source: "Instagram",
    rating: 5,
  },
  {
    couple: "Ayşe & Can",
    text: "Ankara'da araştırdığımız en profesyonel ekip. Kesinlikle tavsiye.",
    source: "dugun.com",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section id="yorumlar" className="section-padding bg-rm-black-soft">
      <div className="section-container">
        <p className="text-center text-xs tracking-[0.3em] text-rm-champagne uppercase">
          Yorumlar
        </p>
        <h2 className="mt-3 text-center font-[family-name:var(--font-cormorant)] text-4xl font-light md:text-5xl">
          Çiftlerimiz Ne Diyor?
        </h2>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <motion.div
              key={t.couple}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="glass-gold rounded-lg p-6"
            >
              <div className="mb-4 flex gap-0.5">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} size={14} className="fill-rm-champagne text-rm-champagne" />
                ))}
              </div>
              <p className="text-sm leading-relaxed text-rm-gray-100">&ldquo;{t.text}&rdquo;</p>
              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <span className="font-[family-name:var(--font-cormorant)] text-lg text-rm-off-white">
                  {t.couple}
                </span>
                <span className="rounded-full bg-white/5 px-3 py-1 text-[10px] tracking-wider text-rm-gray-300 uppercase">
                  {t.source}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
