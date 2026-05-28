"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/config/site";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SiteSearch } from "@/components/layout/site-search";
import { AdminLoginButton } from "@/components/layout/admin-login-button";
import { cn } from "@/lib/utils";
import { EASE_LUXURY } from "@/lib/animations";

/**
 * Hero görüntülenen sayfalarda (sadece anasayfa) navbar şeffaf başlayıp
 * scroll'a göre opaklaşır. Diğer tüm sayfalarda (paket, galeri, vip, vs.)
 * her zaman koyu opak — yoksa içerik üstüne yapışıp menü okunmuyor.
 */
const HERO_TRANSPARENT_PATHS = ["/"];

export function Navbar() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminAuthed, setAdminAuthed] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => setAdminAuthed(Boolean(d.authenticated)))
      .catch(() => setAdminAuthed(false));
  }, [mobileOpen]);

  const allowTransparent = HERO_TRANSPARENT_PATHS.includes(pathname);
  /** Hero sayfaları dışında her zaman koyu opak başlık. */
  const solidNav = !allowTransparent || scrolled;
  const lightNav = scrolled;
  const girisHref = adminAuthed ? "/admin" : "/admin/login";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
          lightNav
            ? "border-b border-black/5 bg-white/90 py-3 shadow-[0_1px_20px_rgba(0,0,0,0.04)] backdrop-blur-xl"
            : solidNav
              ? "border-b border-white/8 bg-rm-black/85 py-4 shadow-[0_2px_20px_rgba(0,0,0,0.35)] backdrop-blur-xl"
              : "bg-gradient-to-b from-rm-black/40 to-transparent py-5"
        )}
      >
        <nav className="section-container flex items-center justify-between gap-4">
          <BrandLogo
            variant={lightNav ? "default" : "on-dark"}
            size="nav"
            priority
          />

          <ul className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "relative text-[11px] font-semibold tracking-[0.18em] uppercase transition-colors",
                    "after:absolute after:-bottom-1 after:left-0 after:h-px after:w-0 after:bg-rm-champagne after:transition-all hover:after:w-full",
                    lightNav
                      ? "text-rm-gray-300 hover:text-rm-black"
                      : "text-white/80 hover:text-white"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-3">
            <SiteSearch light={lightNav} />
            <AdminLoginButton light={lightNav} className="hidden lg:block" />

            <Link
              href="/paket-olustur"
              className={cn(
                "hidden items-center gap-1.5 rounded-full px-5 py-2.5 text-[11px] font-bold tracking-[0.15em] uppercase transition-all md:inline-flex",
                lightNav
                  ? "bg-rm-black text-rm-off-white hover:bg-rm-black-elevated"
                  : "bg-rm-champagne text-rm-black shadow-[0_4px_20px_rgba(196,160,82,0.3)] hover:bg-rm-champagne-light"
              )}
            >
              Rezervasyon
              <span aria-hidden>→</span>
            </Link>

            <button
              type="button"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors lg:hidden",
                lightNav
                  ? "text-rm-black hover:bg-black/5"
                  : "text-white hover:bg-white/10"
              )}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-rm-black pt-24 lg:hidden"
          >
            <ul className="flex flex-col px-6 pb-12">
              {navLinks.map((link, i) => (
                <motion.li
                  key={link.href}
                  initial={{ opacity: 0, x: -16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, ease: EASE_LUXURY }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between border-b border-white/10 py-5 font-editorial text-2xl text-rm-off-white"
                  >
                    {link.label}
                    <span aria-hidden className="text-rm-champagne/60">→</span>
                  </Link>
                </motion.li>
              ))}
              <motion.li
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navLinks.length * 0.04, ease: EASE_LUXURY }}
              >
                <Link
                  href={girisHref}
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-between border-b border-white/10 py-5 font-editorial text-2xl text-rm-off-white"
                >
                  Giriş
                  <span aria-hidden className="text-rm-champagne/60">→</span>
                </Link>
              </motion.li>
              <Link
                href="/paket-olustur"
                onClick={() => setMobileOpen(false)}
                className="mt-10 block rounded-full bg-rm-champagne py-4 text-center text-xs font-bold tracking-[0.2em] text-rm-black uppercase shadow-[0_8px_30px_rgba(196,160,82,0.3)]"
              >
                Online rezervasyon →
              </Link>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
