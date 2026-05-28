import Link from "next/link";
import { AtSign, Mail, MapPin, Phone, ExternalLink } from "lucide-react";
import { siteConfig, navLinks } from "@/config/site";
import { BrandLogo } from "@/components/layout/brand-logo";

const ankaraSeoLinks = [
  { href: "/ankara-dugun-fotografcisi", label: "Düğün fotoğrafçısı" },
  { href: "/ankara-gelin-alma-klibi", label: "Gelin alma klibi" },
  { href: "/ankara-dugun-videosu", label: "Düğün videosu" },
  { href: "/dis-cekim-fiyatlari", label: "Dış çekim fiyatları" },
];

export function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/8 bg-rm-black-soft pt-20 pb-28 lg:pb-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[60rem] -translate-x-1/2 rounded-full bg-rm-champagne/[0.04] blur-3xl"
      />

      <div className="section-container relative">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-4">
            <BrandLogo size="footer" variant="on-dark" />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-rm-gray-400">
              Ankara merkezli premium düğün fotoğrafçılığı ve sinematik düğün
              hikâyeleri.
            </p>
            <Link
              href="/paket-olustur"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-rm-champagne px-5 py-2.5 text-[11px] font-bold tracking-[0.15em] text-rm-black uppercase shadow-[0_4px_20px_rgba(196,160,82,0.2)] transition-all hover:bg-rm-champagne-light"
            >
              Paket oluştur
              <span aria-hidden>→</span>
            </Link>
          </div>

          <div className="md:col-span-2">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase">
              Keşfet
            </p>
            <ul className="mt-5 space-y-3">
              {navLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-rm-gray-400 transition-colors hover:text-rm-off-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase">
              Ankara hizmetleri
            </p>
            <ul className="mt-5 space-y-3">
              {ankaraSeoLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-rm-gray-400 transition-colors hover:text-rm-off-white"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="text-[10px] font-semibold tracking-[0.3em] text-rm-champagne uppercase">
              İletişim
            </p>
            <ul className="mt-5 space-y-3.5 text-sm text-rm-gray-400">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rm-champagne/70" />
                <span>{siteConfig.address}</span>
              </li>
              <li>
                <a
                  href={`tel:${siteConfig.defaultPhone}`}
                  className="flex items-center gap-2.5 hover:text-rm-off-white"
                >
                  <Phone className="h-3.5 w-3.5 shrink-0 text-rm-champagne/70" />
                  {siteConfig.displayPhone}
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="flex items-center gap-2.5 hover:text-rm-off-white"
                >
                  <Mail className="h-3.5 w-3.5 shrink-0 text-rm-champagne/70" />
                  {siteConfig.email}
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-rm-off-white"
                >
                  <AtSign className="h-3.5 w-3.5 shrink-0 text-rm-champagne/70" />
                  @redmedia.co
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.dugun}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 hover:text-rm-off-white"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0 text-rm-champagne/70" />
                  Düğün.com profil
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/8 pt-6 text-xs text-rm-gray-500">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
          </p>
          <Link
            href="/admin/login"
            className="tracking-wide text-rm-gray-600 uppercase transition-colors hover:text-rm-champagne"
          >
            Yönetim girişi
          </Link>
        </div>
      </div>
    </footer>
  );
}
