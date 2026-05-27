"use client";

import { motion } from "framer-motion";
import { Star, Mic, MessageCircle } from "lucide-react";
import { SectionReveal } from "@/components/effects/section-reveal";

const instagramDms = [
  {
    couple: "Elif & Burak",
    time: "14:32",
    text: "Filmi izledik, ağladık, tekrar izledik 😭💛 siz harikasınız",
    avatar: "EB",
  },
  {
    couple: "Zeynep & Emre",
    time: "09:15",
    text: "Reels videomuz 48 saatte 12K görüntülenme aldı 🔥",
    avatar: "ZE",
  },
];

const whatsappReviews = [
  {
    couple: "Ayşe & Can",
    text: "Ankara'da araştırdığımız herkesten profesyonel çıktınız. Drone çekimleri inanılmaz.",
    time: "Dün 18:42",
  },
];

const googleReviews = [
  { couple: "Selin & Mert", rating: 5, text: "5 yıldız bile az. Teslimat hızlı, kalite üst düzey." },
  { couple: "Deniz & Kaan", rating: 5, text: "Same day edit ile salonda herkes büyülendi." },
];

const voiceCards = [
  { couple: "Merve & Ali", duration: "0:42", quote: "İlk görüşte güvendik..." },
];

function InstagramCard({ dm }: { dm: (typeof instagramDms)[0] }) {
  return (
    <div className="rounded-2xl border border-white/8 bg-gradient-to-br from-[#833AB4]/20 via-[#FD1D1D]/10 to-[#F77737]/10 p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-orange-400 text-[10px] font-bold text-white">
          {dm.avatar}
        </div>
        <div>
          <p className="text-xs font-medium text-rm-off-white">{dm.couple}</p>
          <p className="text-[10px] text-rm-gray-400">Instagram · {dm.time}</p>
        </div>
      </div>
      <div className="rounded-2xl rounded-tl-sm bg-rm-black-elevated px-4 py-3">
        <p className="text-sm leading-relaxed text-rm-gray-100">{dm.text}</p>
      </div>
    </div>
  );
}

function WhatsAppCard({ review }: { review: (typeof whatsappReviews)[0] }) {
  return (
    <div className="rounded-lg bg-[#0b141a] p-4 ring-1 ring-[#25D366]/20">
      <div className="mb-2 flex items-center gap-2">
        <MessageCircle className="h-4 w-4 text-[#25D366]" />
        <span className="text-[10px] text-[#25D366]">WhatsApp</span>
        <span className="ml-auto text-[10px] text-rm-gray-500">{review.time}</span>
      </div>
      <div className="relative max-w-[90%] rounded-lg rounded-tl-none bg-[#1f2c34] px-3 py-2">
        <p className="text-xs leading-relaxed text-rm-gray-100">{review.text}</p>
      </div>
      <p className="mt-2 text-[10px] text-rm-gray-500">{review.couple}</p>
    </div>
  );
}

export function SocialProofPremium() {
  return (
    <section id="yorumlar" className="section-padding relative noise-overlay">
      <div className="section-container">
        <SectionReveal>
          <div className="mb-16 max-w-2xl">
            <p className="text-[10px] tracking-[0.4em] text-rm-champagne uppercase">
              Sosyal kanıt
            </p>
            <h2 className="mt-4 font-editorial text-editorial text-rm-off-white">
              Gerçek mesajlar.
              <br />
              Gerçek duygular.
            </h2>
          </div>
        </SectionReveal>

        <div className="grid gap-6 md:grid-cols-12 md:gap-5">
          <div className="space-y-5 md:col-span-4">
            {instagramDms.map((dm, i) => (
              <motion.div
                key={dm.couple}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <InstagramCard dm={dm} />
              </motion.div>
            ))}
          </div>

          <div className="space-y-5 md:col-span-4 md:mt-12">
            {whatsappReviews.map((r) => (
              <WhatsAppCard key={r.couple} review={r} />
            ))}
            {voiceCards.map((v) => (
              <div
                key={v.couple}
                className="glass-premium flex items-center gap-4 rounded-sm p-5"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-rm-champagne/15">
                  <Mic className="h-5 w-5 text-rm-champagne" />
                </div>
                <div>
                  <p className="text-[10px] tracking-wider text-rm-champagne uppercase">
                    Sesli yorum · {v.duration}
                  </p>
                  <p className="mt-1 font-editorial text-lg italic text-rm-cream">
                    {v.quote}
                  </p>
                  <p className="mt-1 text-xs text-rm-gray-400">{v.couple}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 md:col-span-4">
            {googleReviews.map((g, i) => (
              <motion.div
                key={g.couple}
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
                className="glass-gold rounded-sm p-5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{g.couple}</span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: g.rating }).map((_, j) => (
                      <Star
                        key={j}
                        size={12}
                        className="fill-rm-champagne text-rm-champagne"
                      />
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-rm-gray-300">
                  &ldquo;{g.text}&rdquo;
                </p>
                <span className="mt-3 inline-block text-[10px] tracking-wider text-rm-gray-500 uppercase">
                  Google Yorum
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
