"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { SectionReveal, RevealItem } from "@/components/effects/section-reveal";
import { EASE_LUXURY } from "@/lib/animations";

const metrics = [
  { value: 1000, suffix: "+", label: "Mutlu çift", sub: "2014'ten bu yana" },
  { value: 4, suffix: "K", label: "Cinematic", sub: "Her karede sinema" },
  { value: 87, suffix: "%", label: "Tavsiye oranı", sub: "Çiftlerden çiftlere" },
];

const pillars = [
  "Ankara'da en çok teklif alan ekiplerden",
  "Profesyonel RED · Sony sinema ekipmanı",
  "Drone · gimbal · reels-native teslimat",
];

function Counter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const dur = 2200;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      setN(Math.floor(eased * value));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-display text-[clamp(3rem,8vw,5.5rem)] leading-none text-rm-champagne">
      {n}
      {suffix}
    </span>
  );
}

export function EditorialTrust() {
  return (
    <section className="section-padding-sm relative">
      <div className="section-container">
        <div className="grid gap-20 lg:grid-cols-[1.2fr_1fr]">
          <SectionReveal stagger>
            <RevealItem>
              <p className="text-[10px] tracking-[0.4em] text-rm-champagne uppercase">
                Güven · Kanıt
              </p>
              <h2 className="mt-6 max-w-lg font-editorial text-editorial text-rm-off-white">
                Rakamlar yalan söylemez.
              </h2>
            </RevealItem>
            <RevealItem index={1}>
              <ul className="mt-10 space-y-4">
                {pillars.map((p, i) => (
                  <motion.li
                    key={p}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, duration: 0.7, ease: EASE_LUXURY }}
                    className="flex items-start gap-4 border-b border-white/5 pb-4 text-sm text-rm-gray-200"
                  >
                    <span className="font-display text-lg text-rm-champagne/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {p}
                  </motion.li>
                ))}
              </ul>
            </RevealItem>
          </SectionReveal>

          <div className="flex flex-col gap-10 sm:flex-row lg:flex-col lg:gap-12">
            {metrics.map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12, duration: 0.9, ease: EASE_LUXURY }}
                className="glass-premium rounded-sm p-8"
              >
                <Counter value={m.value} suffix={m.suffix} />
                <p className="mt-3 text-sm font-medium text-rm-off-white">{m.label}</p>
                <p className="mt-1 text-[10px] tracking-wide text-rm-gray-400 uppercase">
                  {m.sub}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
