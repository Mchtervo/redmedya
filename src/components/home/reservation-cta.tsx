"use client";

import Link from "next/link";
import { siteConfig } from "@/config/site";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { trackMetaEvent } from "@/lib/meta-pixel";

const RES_WHATSAPP_URL = `https://wa.me/${formatPhoneForWhatsApp(
  siteConfig.defaultWhatsApp
)}?text=${encodeURIComponent(
  "Merhaba REDMEDYA ekibi, web sitenizden ulaşıyorum. Düğün / dış çekim paketi için bilgi ve teklif almak istiyorum."
)}`;

export function ReservationCta() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-rm-champagne via-rm-champagne-light to-rm-champagne py-20 md:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.4), transparent 50%), radial-gradient(circle at 80% 70%, rgba(0,0,0,0.06), transparent 50%)",
        }}
      />
      <div className="section-container relative z-10 text-center">
        <p className="text-[10px] font-semibold tracking-[0.35em] text-rm-black/60 uppercase">
          Rezervasyon
        </p>
        <h2 className="mx-auto mt-4 max-w-2xl font-editorial text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] text-rm-black">
          Hayallerinizle buluşmaya{" "}
          <span className="italic">hazır mısınız?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-sm leading-relaxed text-rm-black/70 md:text-base">
          Paketinizi oluşturun, bilgilerinizi girin — WhatsApp mesajınız otomatik hazırlansın.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/paket-olustur"
            className="group inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full bg-rm-black px-8 py-3.5 text-[11px] font-bold tracking-[0.2em] text-rm-off-white uppercase shadow-[0_8px_30px_rgba(0,0,0,0.2)] transition-all hover:bg-rm-black-elevated"
          >
            Paket oluştur
            <span aria-hidden className="transition-transform group-hover:translate-x-0.5">→</span>
          </Link>
          <a
            href={RES_WHATSAPP_URL}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() =>
              trackMetaEvent("WhatsAppClick", {
                content_name: "reservation_cta",
              })
            }
            className="inline-flex min-w-[220px] items-center justify-center rounded-full border border-rm-black/30 bg-transparent px-8 py-3.5 text-[11px] font-semibold tracking-[0.2em] text-rm-black uppercase transition-colors hover:border-rm-black hover:bg-rm-black hover:text-rm-off-white"
          >
            WhatsApp ile yaz
          </a>
        </div>
      </div>
    </section>
  );
}
