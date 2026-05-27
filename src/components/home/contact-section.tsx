"use client";

import { MessageCircle, Phone, Mail, MapPin, AtSign, ExternalLink } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatPhoneForWhatsApp } from "@/lib/utils";
import { GlassCta } from "@/components/ui/glass-cta";
import { SectionReveal } from "@/components/effects/section-reveal";
import { useWhatsAppLead } from "@/hooks/use-whatsapp-lead";

export function ContactSection() {
  const { openWhatsApp } = useWhatsAppLead();
  const tel = `tel:+${formatPhoneForWhatsApp(siteConfig.defaultPhone)}`;

  return (
    <section id="iletisim" className="section-light section-padding border-t border-black/5">
      <div className="section-container">
        <SectionReveal>
          <div className="editorial-grid items-start">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-rm-champagne uppercase">
                İletişim
              </p>
              <h2 className="mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight text-rm-black">
                Daha fazla soru?
                <br />
                Hemen yanıtlayalım.
              </h2>
              <p className="mt-6 max-w-md text-sm leading-relaxed text-rm-gray-400">
                Paket oluşturucuda hizmetlerinizi seçin, iletişim bilgilerinizi girin — WhatsApp
                mesajınız sepet özetiyle birlikte otomatik hazırlanır.
              </p>
              <div className="mt-10 flex flex-wrap gap-4">
                <GlassCta
                  type="button"
                  variant="whatsapp"
                  onClick={() => openWhatsApp({ contentName: "contact_section" })}
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  WhatsApp
                </GlassCta>
                <GlassCta href="/paket-olustur" variant="ghost">
                  Paket Oluştur
                </GlassCta>
              </div>
            </div>

            <ul className="space-y-6 lg:pt-8">
              <li className="flex gap-4">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-rm-champagne" />
                <div>
                  <p className="text-[10px] tracking-wider text-rm-gray-500 uppercase">
                    Adres
                  </p>
                  <p className="mt-1 text-sm text-rm-gray-200">{siteConfig.address}</p>
                </div>
              </li>
              <li className="flex gap-4">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-rm-champagne" />
                <div>
                  <p className="text-[10px] tracking-wider text-rm-gray-500 uppercase">
                    Telefon / WhatsApp
                  </p>
                  <a
                    href={tel}
                    className="mt-1 block text-sm text-rm-gray-200 hover:text-rm-champagne"
                  >
                    {siteConfig.displayPhone}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <Mail className="mt-0.5 h-5 w-5 shrink-0 text-rm-champagne" />
                <div>
                  <p className="text-[10px] tracking-wider text-rm-gray-500 uppercase">
                    E-posta
                  </p>
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="mt-1 block text-sm text-rm-gray-200 hover:text-rm-champagne"
                  >
                    {siteConfig.email}
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <AtSign className="mt-0.5 h-5 w-5 shrink-0 text-rm-champagne" />
                <div>
                  <p className="text-[10px] tracking-wider text-rm-gray-500 uppercase">
                    Instagram
                  </p>
                  <a
                    href={siteConfig.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-rm-gray-200 hover:text-rm-champagne"
                  >
                    @redmedia.co
                  </a>
                </div>
              </li>
              <li className="flex gap-4">
                <ExternalLink className="mt-0.5 h-5 w-5 shrink-0 text-rm-champagne" />
                <div>
                  <p className="text-[10px] tracking-wider text-rm-gray-500 uppercase">
                    Düğün.com
                  </p>
                  <a
                    href={siteConfig.dugun}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 block text-sm text-rm-gray-200 hover:text-rm-champagne"
                  >
                    RedMedia.co — Ankara
                  </a>
                </div>
              </li>
            </ul>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
