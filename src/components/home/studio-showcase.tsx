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
    <section className="section-light py-20 md:py-28">
      <div className="section-container">
        <SectionReveal>
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-champagne-dark uppercase">
              Çekim deneyimi
            </p>
            <h2 className="mt-4 font-editorial text-[clamp(2rem,5vw,3.75rem)] leading-[1.05] text-rm-black">
              Her an, tam da{" "}
              <span className="italic text-rm-champagne-dark">hayallerinizdeki gibi</span>.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-rm-gray-400 md:text-base">
              Ankara merkezli premium ekip; dış çekim, düğün günü, drone ve reels —
              tek çatı altında profesyonel hizmet.
            </p>
          </div>
        </SectionReveal>

        <div className="relative mt-14 overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.3)] md:mt-16">
          <div className="relative aspect-video w-full">
            <Image
              src="/gallery/01.png"
              alt="REDMEDYA çekim"
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-rm-black/40 via-transparent to-rm-black/10" />
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-5">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-rm-champagne/10 text-rm-champagne-dark transition-colors group-hover:bg-rm-champagne group-hover:text-rm-black">
                <f.icon className="h-5 w-5" strokeWidth={1.5} />
              </div>
              <p className="mt-4 font-editorial text-lg text-rm-black">{f.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-rm-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
