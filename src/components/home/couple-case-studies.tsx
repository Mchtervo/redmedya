"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionReveal } from "@/components/effects/section-reveal";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CaseStudy } from "@/types/site-settings";

function totalSavings(cs: CaseStudy) {
  return (
    (cs.packageDiscount ?? 0) +
    (cs.campaignSavings ?? 0) +
    (cs.giftSavings ?? 0)
  );
}

function CaseStudyCard({ cs }: { cs: CaseStudy }) {
  const savings = totalSavings(cs);
  const hasBreakdown = (cs.subtotal ?? 0) > cs.total || savings > 0;

  return (
    <article className="flex h-full flex-col rounded-sm border border-white/10 bg-rm-black-elevated p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-display text-2xl text-rm-off-white">{cs.couple}</h3>
        {cs.location && (
          <span className="text-xs text-rm-gray-500">{cs.location}</span>
        )}
      </div>

      <div className="mt-3">
        {hasBreakdown && cs.subtotal != null && cs.subtotal > cs.total && (
          <p className="text-sm text-rm-gray-500 line-through">
            Liste + ara toplam {formatPrice(cs.subtotal)}
          </p>
        )}
        <p className="font-display text-3xl text-rm-champagne">
          {formatPrice(cs.total)}
          <span className="ml-2 text-sm font-normal text-rm-gray-500">
            ödenecek paket
          </span>
        </p>
        {savings > 0 && (
          <p className="mt-1 text-sm font-medium text-emerald-400/95">
            Toplam {formatPrice(savings)} kazanç (paket %20 + kampanya + hediye)
          </p>
        )}
      </div>

      <ul className="mt-5 flex-1 space-y-2.5">
        {cs.items.map((item) => {
          const isCampaign = item.includes("yerine") || item.includes("kampanya");
          const isGift = item.includes("hediye");
          return (
            <li
              key={item}
              className={cn(
                "text-sm leading-snug before:mr-2 before:text-rm-champagne before:content-['•']",
                isGift && "text-emerald-400/90",
                isCampaign && "text-rm-champagne/95",
                !isGift && !isCampaign && "text-rm-gray-300"
              )}
            >
              {item}
            </li>
          );
        })}
      </ul>

      {hasBreakdown && (
        <div className="mt-4 space-y-1 rounded-md border border-white/8 bg-white/[0.02] px-3 py-2.5 text-xs">
          {(cs.packageDiscount ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-400/90">
              <span>Paket indirimi (%20)</span>
              <span>−{formatPrice(cs.packageDiscount!)}</span>
            </div>
          )}
          {(cs.campaignSavings ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-400/90">
              <span>Kampanya klipler</span>
              <span>+{formatPrice(cs.campaignSavings!)}</span>
            </div>
          )}
          {(cs.giftSavings ?? 0) > 0 && (
            <div className="flex justify-between text-emerald-400/90">
              <span>Drone hediye</span>
              <span>+{formatPrice(cs.giftSavings!)}</span>
            </div>
          )}
        </div>
      )}

      {cs.quote && (
        <p className="mt-5 border-t border-white/8 pt-4 text-sm italic leading-relaxed text-rm-gray-400">
          “{cs.quote}”
        </p>
      )}
    </article>
  );
}

export function CoupleCaseStudies() {
  const { settings } = useSiteSettings();
  const studies = settings.caseStudies;

  if (!studies.length) return null;

  return (
    <section
      id="gercek-ciftler"
      className="section-padding border-t border-white/8 bg-rm-black scroll-mt-24"
    >
      <div className="section-container">
        <SectionReveal>
          <p className="text-center text-[10px] font-semibold tracking-[0.35em] text-rm-champagne uppercase">
            Gerçek çiftler
          </p>
          <h2 className="mt-4 text-center font-editorial text-[clamp(2rem,5vw,3rem)] text-rm-off-white">
            Paketlerini nasıl oluşturdular?
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-sm text-rm-gray-400">
            Güncel paket fiyatlarımızla aynı mantık — kampanya klipler 3.500₺, paket
            indirimi kampanya dışı hizmetlerde.
          </p>
        </SectionReveal>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {studies.map((cs, i) => (
            <SectionReveal key={cs.id} delay={i * 0.08}>
              <CaseStudyCard cs={cs} />
            </SectionReveal>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button variant="outline" rounded="full" asChild>
            <Link href="/paket-olustur">
              Siz de paketinizi oluşturun
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
