"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect } from "react";
import { usePackageStore } from "@/stores/package-store";

export function CampaignStrip() {
  const campaign = usePackageStore((s) => s.campaign);
  const hydrateFromCms = usePackageStore((s) => s.hydrateFromCms);

  useEffect(() => {
    fetch("/api/public/cms")
      .then((r) => r.json())
      .then((data) => hydrateFromCms(data))
      .catch(() => {});
  }, [hydrateFromCms]);

  if (!campaign.active) return null;

  return (
    <div className="border-b border-rm-champagne/20 bg-gradient-to-r from-rm-champagne/15 via-rm-cream to-rm-champagne/15">
      <div className="section-container flex flex-wrap items-center justify-center gap-3 py-3 text-center">
        <motion.p
          animate={{ opacity: [0.7, 1, 0.7] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="text-xs font-medium tracking-wide text-rm-black md:text-sm"
        >
          {campaign.message}
        </motion.p>
        <span className="hidden text-rm-gray-400 md:inline">|</span>
        <Link
          href={campaign.ctaHref}
          className="text-xs font-semibold tracking-wide text-rm-champagne-dark underline-offset-4 hover:underline md:text-sm"
        >
          {campaign.ctaLabel} →
        </Link>
      </div>
    </div>
  );
}
