"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { SectionReveal, RevealItem } from "@/components/effects/section-reveal";
import { useSectionParallax } from "@/hooks/use-scroll-progress";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { EASE_LUXURY } from "@/lib/animations";

export function StorytellingSection() {
  const { ref, y, scale } = useSectionParallax();
  const reduced = useReducedMotion();

  return (
    <section
      id="hakkimizda"
      ref={ref}
      className="section-padding relative overflow-hidden border-y border-white/[0.04]"
    >
      <div className="section-container">
        <div className="grid gap-16 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-5 lg:pt-24">
            <SectionReveal stagger>
              <RevealItem index={0}>
                <p className="text-[10px] tracking-[0.4em] text-rm-champagne uppercase">
                  Duygu · An · Hikaye
                </p>
              </RevealItem>
              <RevealItem index={1}>
                <h2 className="mt-6 font-display text-[clamp(2.5rem,6vw,4.5rem)] leading-[0.95] text-rm-off-white">
                  Siz sadece
                  <br />
                  <span className="italic text-rm-champagne">evlenmiyorsunuz.</span>
                </h2>
              </RevealItem>
              <RevealItem index={2}>
                <p className="mt-8 text-base leading-[1.8] text-rm-gray-300">
                  Bir ömür sürecek anıları sinematik bir dile çeviriyoruz. Her bakış,
                  her dokunuş, her gözyaşı — kurgulanmış değil, hissedilmiş.
                </p>
              </RevealItem>
              <RevealItem index={3}>
                <blockquote className="mt-10 border-l border-rm-champagne/40 pl-6 font-editorial text-xl italic text-rm-cream md:text-2xl">
                  &ldquo;Biz de böyle görünmek istiyoruz.&rdquo;
                  <span className="mt-3 block text-[10px] not-italic tracking-[0.3em] text-rm-gray-400 uppercase">
                    — Her çiftimizin ortak cümlesi
                  </span>
                </blockquote>
              </RevealItem>
            </SectionReveal>
          </div>

          <div className="relative lg:col-span-7">
            <motion.div
              className="relative aspect-[4/5] overflow-hidden rounded-sm md:aspect-[3/4]"
              style={reduced ? undefined : { y, scale }}
            >
              <Image
                src="/gallery/36.png"
                alt="Cinematic wedding moment"
                fill
                sizes="(max-width:1024px) 100vw, 60vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-rm-black/60 via-transparent to-rm-champagne/10" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, ease: EASE_LUXURY, delay: 0.3 }}
              className="glass-premium absolute -bottom-8 -left-4 max-w-[240px] rounded-sm p-6 md:-left-12"
            >
              <p className="font-display text-4xl text-rm-champagne">12+</p>
              <p className="mt-1 text-[10px] leading-relaxed tracking-[0.15em] text-rm-gray-400 uppercase">
                Yıllık cinematic deneyim
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
