"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { stats } from "@/config/site";
import { Camera, Drone, Film, Users } from "lucide-react";

const icons = [Users, Film, Camera, Drone];

const highlights = [
  "Ankara'da en çok teklif alan ekiplerden",
  "4K cinematic çekimler",
  "Profesyonel ekipman",
  "Drone çekimi",
  "Reels optimized delivery",
];

function AnimatedCounter({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const duration = 2000;
    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, value]);

  return (
    <span ref={ref} className="font-[family-name:var(--font-cormorant)] text-5xl text-rm-champagne md:text-6xl">
      {count}
      {suffix}
    </span>
  );
}

export function StatsSection() {
  return (
    <section className="section-padding border-y border-white/5 bg-rm-black-soft">
      <div className="section-container">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="text-xs tracking-[0.3em] text-rm-champagne uppercase">Güven</p>
            <h2 className="mt-3 font-[family-name:var(--font-cormorant)] text-4xl font-light text-rm-off-white md:text-5xl">
              Rakamlarla REDMEDYA
            </h2>
            <ul className="mt-8 space-y-3">
              {highlights.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-3 text-sm text-rm-gray-200"
                >
                  <span className="h-1 w-1 rounded-full bg-rm-champagne" />
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          <div className="grid grid-cols-2 gap-6">
            {stats.map((stat, i) => {
              const Icon = icons[i] ?? Users;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.6 }}
                  className="glass-gold rounded-lg p-6"
                >
                  <Icon className="mb-3 h-5 w-5 text-rm-champagne" />
                  <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                  <p className="mt-2 text-xs tracking-wide text-rm-gray-300 uppercase">
                    {stat.label}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
