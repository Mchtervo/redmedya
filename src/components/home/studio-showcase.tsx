"use client";

import Image from "next/image";
import { Camera, Film, Sparkles, MapPin } from "lucide-react";
import { SectionReveal } from "@/components/effects/section-reveal";

const features = [
  { icon: Camera, title: "4K Cinematic", desc: "Sinema kalitesinde ekipman" },
  { icon: Film, title: "Düğün Hikayesi", desc: "Tam gün film kurgusu" },
  { icon: Sparkles, title: "Reels & Sosyal", desc: "Vertical-first teslimat" },
  { icon: MapPin, title: "Ankara & Dışı", desc: "Şehir içi ve destinasyon" },
];

export function StudioShowcase() {
  return (
    <section className="section-light py-16 md:py-24">
      <div className="section-container">
        <SectionReveal>
          <div className="text-center">
            <p className="text-xs font-semibold tracking-[0.25em] text-rm-champagne-dark uppercase">
              REDMEDYA Çekim Deneyimi
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight text-rm-black md:text-5xl">
              Her an, tam da hayallerinizdeki gibi.
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-rm-gray-400 md:text-base">
              Ankara merkezli premium ekip; dış çekim, düğün günü, drone ve reels — tek çatı
              altında profesyonel hizmet.
            </p>
          </div>
        </SectionReveal>

        <div className="relative mt-12 overflow-hidden rounded-lg shadow-2xl md:mt-16">
          <div className="relative aspect-video w-full">
            <Image
              src="/gallery/01.png"
              alt="REDMEDYA çekim"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-rm-black/25" />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-lg border border-black/5 bg-white p-5 text-center shadow-sm transition-shadow hover:shadow-md md:p-6"
            >
              <f.icon className="mx-auto h-8 w-8 text-rm-champagne-dark" />
              <p className="mt-3 text-sm font-semibold text-rm-black">{f.title}</p>
              <p className="mt-1 text-xs text-rm-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
