"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { siteConfig } from "@/config/site";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { EASE_LUXURY } from "@/lib/animations";

const HERO_VIDEO =
  "https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-holding-hands-4445-large.mp4";

const HERO_WHATSAPP_URL = `https://wa.me/${formatPhoneForWhatsApp(
  siteConfig.defaultWhatsApp
)}?text=${encodeURIComponent(
  "Merhaba REDMEDYA ekibi, web sitenizden ulaşıyorum. Düğün / dış çekim paketi için bilgi ve teklif almak istiyorum."
)}`;

export function HeroSection() {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex min-h-[min(92svh,900px)] items-center justify-center overflow-hidden">
      <video
        autoPlay
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover"
      >
        <source src={HERO_VIDEO} type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-rm-black/55" />
      <div className="absolute inset-0 bg-gradient-to-b from-rm-black/30 via-transparent to-rm-black/70" />

      <div className="section-container relative z-10 py-20 text-center sm:py-24 md:py-28">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE_LUXURY }}
          className="text-[10px] font-semibold tracking-[0.25em] text-rm-champagne uppercase sm:text-xs sm:tracking-[0.3em]"
        >
          Ankara · Premium Wedding Cinematography
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.9, ease: EASE_LUXURY }}
          className="mx-auto mt-5 max-w-4xl font-editorial text-[clamp(2rem,7vw,5.5rem)] leading-[1.05] tracking-tight text-white sm:mt-6 sm:leading-[1.02]"
        >
          Düğününüzü{" "}
          <span className="italic text-rm-champagne-light">sinematik</span>{" "}
          bir hikâyeye dönüştürüyoruz
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={introDone ? { opacity: 1 } : {}}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-white/75 sm:mt-7 md:text-base"
        >
          Ankara · Premium düğün fotoğrafçılığı, dış çekim, drone ve sinematik klip.
          Paketinizi tasarlayın, fiyatı anında görün.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-8 flex w-full flex-col items-center justify-center gap-2.5 sm:mt-12 sm:w-auto sm:flex-row sm:gap-3"
        >
          <Link
            href="/paket-olustur"
            onClick={() => trackMetaEvent("InitiateCheckout", { content_name: "hero_cta" })}
            className="group inline-flex w-full max-w-xs items-center justify-center gap-2 rounded-full bg-rm-champagne px-6 py-3.5 text-[11px] font-bold tracking-[0.2em] text-rm-black uppercase shadow-[0_8px_30px_rgba(196,160,82,0.25)] transition-all hover:bg-rm-champagne-light hover:shadow-[0_8px_40px_rgba(196,160,82,0.45)] sm:w-auto sm:min-w-[220px] sm:px-8"
          >
            Paket oluştur
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <a
            href={HERO_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackMetaEvent("WhatsAppClick", { content_name: "hero_whatsapp" })
            }
            className="inline-flex w-full max-w-xs items-center justify-center rounded-full border border-white/30 bg-white/[0.04] px-6 py-3.5 text-[11px] font-semibold tracking-[0.2em] text-white uppercase backdrop-blur-sm transition-colors hover:border-white hover:bg-white/10 sm:w-auto sm:min-w-[220px] sm:px-8"
          >
            WhatsApp ile yaz
          </a>
        </motion.div>
      </div>
    </section>
  );
}
