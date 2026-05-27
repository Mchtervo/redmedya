"use client";

import Link from "next/link";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";

export function ReservationCta() {
  const { openWhatsApp } = useWhatsAppLead();

  return (
    <section className="relative overflow-hidden bg-rm-champagne py-16 md:py-20">
      <div className="section-container relative z-10 text-center">
        <h2 className="font-display text-3xl text-rm-black md:text-4xl">
          Hayallerinizle buluşmaya hazır mısınız?
        </h2>
        <p className="mx-auto mt-4 max-w-lg text-sm text-rm-black/70 md:text-base">
          Paketinizi oluşturun, bilgilerinizi girin — WhatsApp mesajınız otomatik hazırlansın.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href="/paket-olustur"
            className="min-w-[220px] bg-rm-black px-8 py-4 text-xs font-semibold tracking-[0.15em] text-rm-off-white uppercase transition-opacity hover:opacity-90"
          >
            Online rezervasyon
          </Link>
          <button
            type="button"
            onClick={() => openWhatsApp({ contentName: "reservation_cta" })}
            className="min-w-[220px] border-2 border-rm-black px-8 py-4 text-xs font-semibold tracking-[0.15em] text-rm-black uppercase transition-colors hover:bg-rm-black hover:text-rm-off-white"
          >
            WhatsApp ile ulaş
          </button>
        </div>
      </div>
    </section>
  );
}
