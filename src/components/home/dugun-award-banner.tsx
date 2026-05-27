"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Award, ExternalLink, Sparkles } from "lucide-react";
import { siteConfig } from "@/config/site";
import { EASE_LUXURY } from "@/lib/animations";

export function DugunAwardBanner() {
  return (
    <section className="relative overflow-hidden border-y border-rm-champagne/20 bg-gradient-to-br from-rm-black via-[#141210] to-rm-black py-14 md:py-20">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        aria-hidden
        style={{
          backgroundImage:
            "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(196,160,82,0.18), transparent 70%)",
        }}
      />
      <div className="section-container relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7, ease: EASE_LUXURY }}
          className="mx-auto max-w-4xl text-center"
        >
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-rm-champagne/30 bg-rm-champagne/10 px-4 py-1.5">
            <Sparkles className="h-3.5 w-3.5 text-rm-champagne" />
            <span className="text-[10px] font-semibold tracking-[0.28em] text-rm-champagne uppercase">
              Düğün.com Onaylı
            </span>
          </div>

          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-rm-champagne/40 bg-rm-champagne/10 shadow-[0_0_60px_rgba(196,160,82,0.25)]">
            <Award className="h-10 w-10 text-rm-champagne" strokeWidth={1.25} />
          </div>

          <p className="text-[10px] font-medium tracking-[0.35em] text-rm-gray-400 uppercase">
            Düğün.com · Ankara · 2025
          </p>
          <h2 className="mt-4 font-editorial text-[clamp(1.75rem,5vw,3.25rem)] leading-[1.1] text-rm-off-white">
            En çok teklif alan
            <span className="mt-2 block text-rm-champagne">3. fotoğrafçı ödülü</span>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-rm-gray-400 md:text-base">
            Ankara&apos;da çiftlerin tercih ettiği profesyoneller arasında yerimizi aldık.
            Profilinizi inceleyin, yorumları okuyun — ardından kendi paketinizi oluşturun.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={siteConfig.dugun}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-w-[240px] items-center justify-center gap-2 bg-rm-champagne px-8 py-4 text-xs font-bold tracking-[0.15em] text-rm-black uppercase transition-opacity hover:opacity-90"
            >
              Düğün.com profilimiz
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
            <Link
              href="/paket-olustur"
              className="inline-flex min-w-[240px] items-center justify-center border border-white/20 px-8 py-4 text-xs font-bold tracking-[0.15em] text-rm-off-white uppercase transition-colors hover:border-rm-champagne/40 hover:text-rm-champagne"
            >
              Paket oluştur
            </Link>
          </div>

          <p className="mt-8 text-xs text-rm-gray-500">
            5,0 puan · 31+ çift yorumu · Sincan / Ankara
          </p>
        </motion.div>
      </div>
    </section>
  );
}
