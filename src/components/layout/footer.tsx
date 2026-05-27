import Link from "next/link";
import { siteConfig, navLinks } from "@/config/site";
import { BrandLogo } from "@/components/layout/brand-logo";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-rm-black-soft py-16 pb-24 lg:pb-16">
      <div className="section-container">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo size="footer" variant="on-dark" />
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-rm-gray-400">
              Ankara merkezli ultra premium düğün fotoğrafçılığı ve cinematic wedding
              storytelling.
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold tracking-wider text-rm-champagne uppercase">
              Keşfet
            </p>
            <ul className="mt-4 space-y-2">
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
          <div>
            <p className="text-xs font-semibold tracking-wider text-rm-champagne uppercase">
              Rezervasyon
            </p>
            <ul className="mt-4 space-y-2">
              <li>
                <Link
                  href="/paket-olustur"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  Paket Oluştur
                </Link>
              </li>
              <li>
                <Link
                  href="/#iletisim"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  İletişim
                </Link>
              </li>
              <li>
                <a
                  href={siteConfig.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  Instagram
                </a>
              </li>
              <li>
                <a
                  href={siteConfig.dugun}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  Düğün.com
                </a>
              </li>
            </ul>
            <p className="mt-6 text-xs font-semibold tracking-wider text-rm-champagne uppercase">
              Ankara SEO
            </p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link
                  href="/ankara-dugun-fotografcisi"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  Düğün fotoğrafçısı
                </Link>
              </li>
              <li>
                <Link
                  href="/ankara-gelin-alma-klibi"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  Gelin alma klibi
                </Link>
              </li>
              <li>
                <Link
                  href="/ankara-dugun-videosu"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  Düğün videosu
                </Link>
              </li>
              <li>
                <Link
                  href="/dis-cekim-fiyatlari"
                  className="text-sm text-rm-gray-400 hover:text-rm-off-white"
                >
                  Dış çekim fiyatları
                </Link>
              </li>
            </ul>
            <p className="mt-6 text-sm text-rm-gray-500">
              {siteConfig.displayPhone}
              <br />
              {siteConfig.email}
            </p>
          </div>
        </div>
        <p className="mt-12 border-t border-white/5 pt-8 text-center text-xs text-rm-gray-500">
          © {new Date().getFullYear()} {siteConfig.name}. Tüm hakları saklıdır.
          <span className="mx-2 text-rm-gray-600">·</span>
          <Link
            href="/admin/login"
            className="text-rm-gray-600 transition-colors hover:text-rm-gray-400"
          >
            Giriş
          </Link>
        </p>
      </div>
    </footer>
  );
}
