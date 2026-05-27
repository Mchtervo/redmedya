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
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="rounded-sm border border-rm-champagne/25 bg-white p-6 shadow-sm md:p-8">
              <div className="flex items-center gap-2 text-rm-champagne-dark">
                <Star className="h-5 w-5 fill-current" />
                <span className="text-xs font-bold tracking-wider uppercase">
                  Düğün.com
                </span>
              </div>
              <p className="mt-4 text-lg leading-relaxed text-rm-gray-700">
                {settings.social.dugunHighlight}
              </p>
              <Link
                href={siteConfig.dugun}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-rm-champagne-dark hover:underline"
              >
                Profilimizi görüntüleyin
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>

            <div className="rounded-sm border border-black/8 bg-rm-cream p-6 md:p-8">
              <div className="flex items-center gap-2">
                <Share2 className="h-5 w-5 text-rm-champagne-dark" />
                <span className="text-xs font-bold tracking-wider text-rm-gray-600 uppercase">
                  Instagram
                </span>
              </div>
              <p className="mt-4 text-lg leading-relaxed text-rm-gray-700">
                {settings.social.instagramCta}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-rm-black px-5 py-2.5 text-sm font-semibold text-rm-off-white hover:bg-rm-black-elevated"
                >
                  @redmedia.co
                  <ExternalLink className="h-3.5 w-3.5" />
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
                      className="inline-flex items-center gap-1 text-sm text-rm-champagne-dark underline"
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
