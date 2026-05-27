"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function UrgencyBanner() {
  return (
    <section className="border-y border-rm-champagne/20 bg-gradient-to-r from-rm-champagne/10 via-transparent to-rm-champagne/10 py-6">
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="section-container flex flex-col items-center justify-between gap-4 text-center md:flex-row md:text-left"
      >
        <div>
          <p className="text-xs tracking-[0.25em] text-rm-champagne uppercase animate-pulse">
            Sınırlı Kontenjan
          </p>
          <p className="mt-1 font-[family-name:var(--font-cormorant)] text-xl text-rm-off-white md:text-2xl">
            2026 sezonu doluyor — erken rezervasyon avantajı
          </p>
        </div>
        <Button asChild variant="default" size="sm">
          <Link href="/paket-olustur">Hemen Rezervasyon Yap</Link>
        </Button>
      </motion.div>
    </section>
  );
}
