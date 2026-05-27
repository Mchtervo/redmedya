"use client";

import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { GlassCta } from "@/components/ui/glass-cta";
import { SectionReveal } from "@/components/effects/section-reveal";

export function PackageCtaSection() {
  return (
    <section className="relative overflow-hidden py-[clamp(6rem,18vw,14rem)]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(196,160,82,0.08),transparent)]" />
      <div className="section-container relative">
        <SectionReveal>
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-[10px] tracking-[0.45em] text-rm-champagne uppercase">
              Paket oluşturucu
            </p>
            <h2 className="mt-8 font-editorial text-[clamp(2.5rem,8vw,5.5rem)] leading-[0.95] text-rm-off-white">
              Hayalinizdeki düğün,
              <br />
              <span className="text-luxury-gradient">tek tıkla paket.</span>
            </h2>
            <p className="mx-auto mt-8 max-w-md text-sm leading-relaxed text-rm-gray-400">
              Canlı fiyat, otomatik indirim, WhatsApp rezervasyon. Ajans kalitesi,
              butik samimiyet.
            </p>
            <div className="mt-12 flex justify-center">
              <GlassCta href="/paket-olustur">
                Başla
                <ArrowUpRight className="h-3.5 w-3.5" />
              </GlassCta>
            </div>
            <motion.p
              className="mt-8 text-[10px] tracking-[0.3em] text-rm-gray-500 uppercase"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              Ortalama tamamlama süresi · 2 dakika
            </motion.p>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
