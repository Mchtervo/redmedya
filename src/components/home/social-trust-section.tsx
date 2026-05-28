"use client";

import Link from "next/link";
import { ExternalLink, Share2, Star } from "lucide-react";
import { SectionReveal } from "@/components/effects/section-reveal";
import { siteConfig } from "@/config/site";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { DugunAwardBanner } from "@/components/home/dugun-award-banner";

export function SocialTrustSection() {
  const { settings } = useSiteSettings();

  return (
    <section id="guven" className="section-light section-padding">
      <div className="section-container space-y-12">
        <DugunAwardBanner />

        <SectionReveal>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="group relative overflow-hidden rounded-2xl border border-rm-champagne/20 bg-white p-7 transition-all hover:-translate-y-1 hover:border-rm-champagne/40 hover:shadow-[0_20px_50px_-15px_rgba(196,160,82,0.25)] md:p-9">
              <div className="flex items-center gap-2 text-rm-champagne-dark">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rm-champagne/15">
                  <Star className="h-4 w-4 fill-current" />
                </span>
                <span className="text-[10px] font-semibold tracking-[0.25em] uppercase">
                  Düğün.com
                </span>
              </div>
              <p className="mt-5 font-editorial text-xl leading-relaxed text-rm-gray-700 md:text-2xl">
                {settings.social.dugunHighlight}
              </p>
              <Link
                href={siteConfig.dugun}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-rm-champagne-dark uppercase transition-colors hover:text-rm-black"
              >
                Profili görüntüleyin
                <ExternalLink className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-black/[0.06] bg-rm-cream p-7 transition-all hover:-translate-y-1 hover:shadow-[0_20px_50px_-15px_rgba(0,0,0,0.1)] md:p-9">
              <div className="flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rm-black/8 text-rm-black">
                  <Share2 className="h-4 w-4" />
                </span>
                <span className="text-[10px] font-semibold tracking-[0.25em] text-rm-gray-600 uppercase">
                  Instagram
                </span>
              </div>
              <p className="mt-5 font-editorial text-xl leading-relaxed text-rm-gray-700 md:text-2xl">
                {settings.social.instagramCta}
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-rm-black px-5 py-2.5 text-xs font-semibold tracking-[0.1em] text-rm-off-white uppercase transition-colors hover:bg-rm-black-elevated"
                >
                  @redmedia.co
                  <ExternalLink className="h-3 w-3" />
                </Link>
                {settings.social.instagramPostUrls
                  .filter((u) => u !== siteConfig.instagram)
                  .slice(0, 2)
                  .map((url) => (
                    <Link
                      key={url}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold tracking-[0.1em] text-rm-champagne-dark uppercase hover:underline"
                    >
                      Son paylaşım
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        </SectionReveal>
      </div>
    </section>
  );
}
