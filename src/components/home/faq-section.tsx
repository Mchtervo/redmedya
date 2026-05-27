"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { SectionReveal } from "@/components/effects/section-reveal";
import { cn } from "@/lib/utils";

const faqs = [
  {
    q: "Paket fiyatları nasıl hesaplanıyor?",
    a: "Seçtiğiniz her hizmet canlı olarak toplama eklenir. 2, 3 ve 5+ hizmet kademelerinde otomatik indirim uygulanır — progress bar üzerinden takip edebilirsiniz.",
  },
  {
    q: "Teslimat süreleri?",
    a: "Reels 10–14 gün, fotoğraf 4–6 hafta, tam cinematic film 8–12 hafta. Same Day Edit düğün günü akşamı.",
  },
  {
    q: "Ankara dışı çekim?",
    a: "Kapadokya, sahil ve özel destinasyonlar dahil. Şehir dışı hizmetini paket oluşturucudan ekleyin.",
  },
  {
    q: "Ödeme ve kapora?",
    a: "Kapora ile tarih rezervasyonu. Kalan tutar taksitlendirilebilir. Online ödeme altyapısı yakında.",
  },
];

export function FaqSection() {
  return (
    <section className="section-light section-padding border-t border-black/5">
      <div className="section-container">
        <SectionReveal>
          <div className="grid gap-16 lg:grid-cols-2">
            <div>
              <p className="text-[10px] tracking-[0.4em] text-rm-champagne uppercase">SSS</p>
              <h2 className="mt-6 font-display text-[clamp(2rem,5vw,3.5rem)] leading-tight text-rm-black">
                Sorularınız varsa, cevaplar burada.
              </h2>
            </div>
            <Accordion.Root type="single" collapsible className="space-y-2">
              {faqs.map((faq) => (
                <Accordion.Item
                  key={faq.q}
                  value={faq.q}
                  className="rounded-lg border border-black/5 bg-white px-4"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between py-5 text-left text-sm text-rm-black transition-colors hover:text-rm-champagne-dark">
                      {faq.q}
                      <ChevronDown
                        size={16}
                        className="shrink-0 text-rm-champagne transition-transform duration-500 group-data-[state=open]:rotate-180"
                      />
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content
                    className={cn(
                      "overflow-hidden text-sm leading-[1.8] text-rm-gray-400",
                      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
                    )}
                  >
                    <p className="pb-5">{faq.a}</p>
                  </Accordion.Content>
                </Accordion.Item>
              ))}
            </Accordion.Root>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
