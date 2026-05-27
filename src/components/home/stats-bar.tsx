"use client";

import { Users, Heart, Award } from "lucide-react";

const stats = [
  { icon: Users, value: "15K+", label: "Sosyal Medya", sub: "Takipçi" },
  { icon: Heart, value: "1000+", label: "Mutlu Çift", sub: "Ankara & Türkiye" },
  { icon: Award, value: "4K", label: "Cinematic", sub: "Profesyonel çekim" },
];

export function StatsBar() {
  return (
    <section className="section-light border-b border-black/5 py-10 md:py-14">
      <div className="section-container">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-rm-champagne/15 text-rm-champagne-dark">
                <s.icon className="h-6 w-6" />
              </div>
              <div className="mt-3 sm:mt-0">
                <p className="font-display text-3xl text-rm-black md:text-4xl">{s.value}</p>
                <p className="text-sm font-medium text-rm-black">{s.label}</p>
                <p className="text-xs text-rm-gray-400">{s.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
