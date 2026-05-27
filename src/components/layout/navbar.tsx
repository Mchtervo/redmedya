"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { navLinks } from "@/config/site";
import { BrandLogo } from "@/components/layout/brand-logo";
import { SiteSearch } from "@/components/layout/site-search";
import { AdminLoginButton } from "@/components/layout/admin-login-button";
import { cn } from "@/lib/utils";
import { EASE_LUXURY } from "@/lib/animations";

export function Navbar() {
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

  const lightNav = scrolled;
  const girisHref = adminAuthed ? "/admin" : "/admin/login";

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 left-0 z-50 transition-all duration-300",
          lightNav
            ? "border-b border-black/5 bg-white/95 py-3 shadow-sm backdrop-blur-md"
            : "bg-transparent py-5"
        )}
      >
        <nav className="section-container flex items-center justify-between">
          <BrandLogo
            variant={lightNav ? "default" : "on-dark"}
            size="nav"
            priority
          />

          <ul className="hidden items-center gap-8 lg:flex">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    "text-xs font-semibold tracking-wide uppercase transition-colors hover:text-rm-champagne-dark",
                    lightNav ? "text-rm-gray-400" : "text-white/90"
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
                "hidden px-5 py-2.5 text-xs font-bold tracking-wide uppercase transition-colors md:inline-block",
                lightNav
                  ? "bg-rm-champagne text-rm-black hover:opacity-90"
                  : "bg-white text-rm-black hover:bg-rm-cream"
              )}
            >
              Rezervasyon
            </Link>

            <button
              type="button"
              className={cn("lg:hidden", lightNav ? "text-rm-black" : "text-white")}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menü"
            >
              {mobileOpen ? <X size={24} /> : <Menu size={24} />}
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
            className="fixed inset-0 z-40 bg-white pt-24 lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-6">
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
                    className="block border-b border-black/5 py-4 text-lg font-medium text-rm-black"
                  >
                    {link.label}
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
                  className="block border-b border-black/5 py-4 text-lg font-medium text-rm-black"
                >
                  Giriş
                </Link>
              </motion.li>
              <Link
                href="/paket-olustur"
                onClick={() => setMobileOpen(false)}
                className="mt-6 block bg-rm-champagne py-4 text-center text-xs font-bold tracking-wide text-rm-black uppercase"
              >
                Online rezervasyon
              </Link>
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
