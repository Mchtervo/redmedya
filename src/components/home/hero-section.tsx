"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";
import { trackMetaEvent } from "@/lib/meta-pixel";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";
import { EASE_LUXURY } from "@/lib/animations";

const HERO_VIDEO =
  "https://assets.mixkit.co/videos/preview/mixkit-bride-and-groom-holding-hands-4445-large.mp4";

export function HeroSection() {
  const [introDone, setIntroDone] = useState(false);
  const { openWhatsApp } = useWhatsAppLead();

  useEffect(() => {
    const t = setTimeout(() => setIntroDone(true), 2000);
    return () => clearTimeout(t);
  }, []);

  return (
    <section className="relative flex min-h-[min(92vh,900px)] items-center justify-center overflow-hidden">
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

      <div className="section-container relative z-10 py-28 text-center">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8, ease: EASE_LUXURY }}
          className="text-xs font-semibold tracking-[0.3em] text-rm-champagne uppercase"
        >
          Ankara · Premium Wedding Cinematography
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.15, duration: 0.9, ease: EASE_LUXURY }}
          className="mx-auto mt-6 max-w-4xl font-display text-4xl leading-[1.1] text-white md:text-6xl lg:text-7xl"
        >
          Hayallerinizle
          <br />
          <span className="text-rm-champagne-light">buluşmaya hazır mısınız?</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={introDone ? { opacity: 1 } : {}}
          transition={{ delay: 0.35, duration: 0.8 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-white/85 md:text-lg"
        >
          Türkiye&apos;nin önde gelen düğün hikayesi markalarından REDMEDYA ile tanışın.
          Cinematic çekim, drone, reels ve özel paket oluşturucu.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={introDone ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <Link
            href="/paket-olustur"
            onClick={() => trackMetaEvent("InitiateCheckout", { content_name: "hero_cta" })}
            className="min-w-[240px] bg-rm-champagne px-10 py-4 text-xs font-bold tracking-[0.15em] text-rm-black uppercase transition-opacity hover:opacity-90"
          >
            Online rezervasyon
          </Link>
          <button
            type="button"
            onClick={() => openWhatsApp({ contentName: "hero_whatsapp" })}
            className="min-w-[240px] border-2 border-white px-10 py-4 text-xs font-bold tracking-[0.15em] text-white uppercase transition-colors hover:bg-white hover:text-rm-black"
          >
            WhatsApp ile ulaş
          </button>
        </motion.div>
      </div>
    </section>
  );
}
