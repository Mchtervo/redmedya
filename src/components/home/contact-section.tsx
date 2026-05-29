"use client";

import { MessageCircle, Phone, Mail, MapPin, AtSign, ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { GlassCta } from "@/components/ui/glass-cta";
import { SectionReveal } from "@/components/effects/section-reveal";
import { trackMetaEvent } from "@/lib/meta-pixel";

const CONTACT_WHATSAPP_URL = `https://wa.me/${formatPhoneForWhatsApp(
  siteConfig.defaultWhatsApp
)}?text=${encodeURIComponent(
  "Merhaba REDMEDYA ekibi, web sitenizden ulaşıyorum. Düğün / dış çekim paketi için bilgi ve teklif almak istiyorum."
)}`;

export function ContactSection() {
  const tel = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;

  type ContactItem = {
    icon: typeof MapPin;
    label: string;
    value: string;
    href?: string;
    external?: boolean;
  };

  const items: ContactItem[] = [
    { icon: MapPin, label: "Adres", value: siteConfig.address },
    {
      icon: Phone,
      label: "Telefon / WhatsApp",
      value: siteConfig.displayPhone,
      href: tel,
    },
    {
      icon: Mail,
      label: "E-posta",
      value: siteConfig.email,
      href: `mailto:${siteConfig.email}`,
    },
    {
      icon: AtSign,
      label: "Instagram",
      value: "@redmedia.co",
      href: siteConfig.instagram,
      external: true,
    },
    {
      icon: ExternalLink,
      label: "Düğün.com",
      value: "RedMedia.co — Ankara",
      href: siteConfig.dugun,
      external: true,
    },
  ];

  return (
    <section
      id="iletisim"
      className="section-padding relative overflow-hidden bg-rm-black-soft"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute top-0 right-0 h-96 w-96 rounded-full bg-rm-champagne/[0.04] blur-3xl"
      />
      <div className="section-container relative">
        <SectionReveal>
          <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-20">
            <div>
              <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase sm:tracking-[0.4em]">
                İletişim
              </p>
              <h2 className="mt-4 font-editorial text-[clamp(1.75rem,5vw,3.5rem)] leading-[1.05] text-rm-off-white sm:mt-5">
                Daha fazla soru?{" "}
                <span className="italic text-rm-champagne-light">
                  Hemen yanıtlayalım
                </span>
                .
              </h2>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-rm-gray-400 sm:mt-6">
                Paket oluşturucuda hizmetlerinizi seçin, iletişim bilgilerinizi
                girin — WhatsApp mesajınız sepet özetiyle birlikte otomatik
                hazırlanır.
              </p>
              <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
                <GlassCta
                  href={CONTACT_WHATSAPP_URL}
                  external
                  variant="whatsapp"
                  onClick={() =>
                    trackMetaEvent("WhatsAppClick", {
                      content_name: "contact_section",
                    })
                  }
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </GlassCta>
                <GlassCta href="/paket-olustur" variant="ghost">
                  Paket Oluştur
                </GlassCta>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3 lg:pt-6">
              {items.map((item) => {
                const Icon = item.icon;
                const content = (
                  <div className="flex h-full items-start gap-3.5 rounded-2xl border border-white/8 bg-rm-black-elevated/40 p-4 transition-all hover:-translate-y-0.5 hover:border-rm-champagne/25 hover:bg-rm-black-elevated sm:gap-4 sm:p-5">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rm-champagne/10 text-rm-champagne">
                      <Icon className="h-4 w-4" strokeWidth={1.5} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-semibold tracking-[0.2em] text-rm-gray-500 uppercase">
                        {item.label}
                      </p>
                      <p className="mt-1 truncate text-sm text-rm-off-white">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a
                        href={item.href}
                        target={item.external ? "_blank" : undefined}
                        rel={item.external ? "noopener noreferrer" : undefined}
                      >
                        {content}
                      </a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
