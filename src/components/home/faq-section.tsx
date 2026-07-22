"use client";

import * as Accordion from "@radix-ui/react-accordion";
import { ChevronDown } from "lucide-react";
import { SectionReveal } from "@/components/effects/section-reveal";
import { cn } from "@/lib/utils";
import { GENERAL_FAQ } from "@/config/faq";

const faqs = GENERAL_FAQ;

export function FaqSection() {
  return (
    <section className="section-light section-padding border-t border-black/5">
      <div className="section-container">
        <SectionReveal>
          <div className="grid gap-14 lg:grid-cols-[1fr_1.3fr] lg:gap-20">
            <div className="lg:sticky lg:top-32 lg:self-start">
              <p className="text-[10px] font-semibold tracking-[0.4em] text-rm-champagne-dark uppercase">
                S.S.S
              </p>
              <h2 className="mt-5 font-editorial text-[clamp(2rem,5vw,3.5rem)] leading-[1.05] text-rm-black">
                Sorularınız varsa,{" "}
                <span className="italic text-rm-champagne-dark">cevaplar burada</span>.
              </h2>
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-rm-gray-400">
                Listede bulamadığınız bir soru için WhatsApp üzerinden hızlıca
                yanıt verelim.
              </p>
            </div>
            <Accordion.Root type="single" collapsible className="space-y-3">
              {faqs.map((faq) => (
                <Accordion.Item
                  key={faq.q}
                  value={faq.q}
                  className="overflow-hidden rounded-2xl border border-black/[0.06] bg-white px-6 transition-colors data-[state=open]:border-rm-champagne/30 data-[state=open]:bg-rm-champagne/[0.03]"
                >
                  <Accordion.Header>
                    <Accordion.Trigger className="group flex w-full items-center justify-between gap-4 py-5 text-left text-base font-medium text-rm-black transition-colors hover:text-rm-champagne-dark">
                      {faq.q}
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rm-champagne/10 text-rm-champagne-dark transition-all group-data-[state=open]:rotate-180 group-data-[state=open]:bg-rm-champagne group-data-[state=open]:text-rm-black">
                        <ChevronDown size={14} strokeWidth={2.5} />
                      </span>
                    </Accordion.Trigger>
                  </Accordion.Header>
                  <Accordion.Content
                    className={cn(
                      "overflow-hidden text-sm leading-[1.75] text-rm-gray-400",
                      "data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
                    )}
                  >
                    <p className="pb-6 pr-10">{faq.a}</p>
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
