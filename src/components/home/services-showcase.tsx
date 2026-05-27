"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { defaultServices } from "@/config/services";
import { formatPrice } from "@/lib/utils";

const thumbs = [
  "/gallery/05.png",
  "/gallery/12.png",
  "/gallery/23.png",
  "/gallery/07.png",
  "/gallery/39.png",
  "/gallery/44.png",
];

export function ServicesShowcase() {
  const items = defaultServices.slice(0, 6);

  return (
    <section className="section-dark py-16 md:py-24">
      <div className="section-container">
        <div className="text-center">
          <p className="text-xs tracking-[0.25em] text-rm-champagne uppercase">
            Hizmetlerimiz
          </p>
          <h2 className="mt-4 font-display text-3xl text-rm-off-white md:text-5xl">
            Tüm hizmetler bir arada
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-rm-gray-400">
            İhtiyacınıza göre paketinizi oluşturun — canlı fiyat, otomatik indirim.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((service, i) => (
            <Link
              key={service.id}
              href="/paket-olustur"
              className="group overflow-hidden rounded-lg border border-white/8 bg-rm-black-elevated transition-all hover:border-rm-champagne/30 hover:shadow-[0_0_40px_rgba(196,160,82,0.12)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src={thumbs[i] ?? "/gallery/01.png"}
                  alt={service.name}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width:640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-rm-black/90 to-transparent" />
                <p className="absolute right-3 bottom-3 left-3 font-display text-xl text-rm-off-white">
                  {service.name}
                </p>
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-sm text-rm-champagne">{formatPrice(service.price)}</span>
                <ArrowRight className="h-4 w-4 text-rm-gray-500 transition-transform group-hover:translate-x-1 group-hover:text-rm-champagne" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/paket-olustur"
            className="inline-flex items-center gap-2 bg-rm-champagne px-8 py-4 text-xs font-semibold tracking-[0.15em] text-rm-black uppercase transition-opacity hover:opacity-90"
          >
            Online paket oluştur
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
