"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { trackFunnelEvent } from "@/lib/analytics/client";
import { track } from "@/lib/track/tracker";
import { getVisitorKind } from "@/lib/track/session";

const HERO_RATIO = 0.75;
const END_RATIO = 0.9;

type Milestone = "hero" | "packages" | "plato" | "continue" | "end";

/**
 * Tüm public sayfalarda first-party yolculuk (PII yok).
 * Çerez onayı beklemez. Meta Pixel / GA4 buradan gitmez.
 * Kalma süresi yalnızca sekme görünürken birikir (arka plan / timeout hariç).
 */
export function SiteJourneyTracker() {
  const pathname = usePathname();
  const pageEnteredAt = useRef(0);
  const visibleSince = useRef(0);
  const activeMs = useRef(0);
  const prevPath = useRef<string | null>(null);
  const started = useRef(false);
  const seen = useRef<Record<Milestone, boolean>>({
    hero: false,
    packages: false,
    plato: false,
    continue: false,
    end: false,
  });

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin")) return;

    const pauseActive = () => {
      if (visibleSince.current > 0) {
        activeMs.current += Math.max(0, Date.now() - visibleSince.current);
        visibleSince.current = 0;
      }
    };

    const resumeActive = () => {
      if (document.visibilityState === "visible") {
        visibleSince.current = Date.now();
      }
    };

    const leavePayload = (path: string) => {
      pauseActive();
      const wall = Math.max(0, Date.now() - pageEnteredAt.current);
      const active = Math.max(0, Math.min(activeMs.current, wall || activeMs.current));
      return { path, dwell_ms: wall, active_ms: active };
    };

    const leavePrev = () => {
      const prev = prevPath.current;
      if (!prev || pageEnteredAt.current <= 0) return;
      const payload = leavePayload(prev);
      trackFunnelEvent("PageLeave", { metadata: payload });
      track("page_leave", payload);
    };

    if (prevPath.current && prevPath.current !== pathname) {
      leavePrev();
    }

    pageEnteredAt.current = Date.now();
    activeMs.current = 0;
    visibleSince.current =
      document.visibilityState === "visible" ? Date.now() : 0;
    prevPath.current = pathname;
    seen.current = {
      hero: false,
      packages: false,
      plato: false,
      continue: false,
      end: false,
    };

    if (!started.current) {
      started.current = true;
      let already = false;
      try {
        already = sessionStorage.getItem("rm_sess_start_sent") === "1";
        if (!already) sessionStorage.setItem("rm_sess_start_sent", "1");
      } catch {
        /* ignore */
      }
      if (!already) {
        const returning = getVisitorKind() === "returning";
        trackFunnelEvent("SessionStart", {
          metadata: { path: pathname, is_returning: returning },
        });
        track("session_start", { path: pathname, is_returning: returning });
      }
    }

    track("page_view", { path: pathname });

    const fireMilestone = (milestone: Milestone) => {
      if (seen.current[milestone]) return;
      seen.current[milestone] = true;
      trackFunnelEvent("ScrollDepth", {
        metadata: { milestone, path: pathname },
      });
      track("scroll_depth", { milestone, path: pathname });
    };

    const measure = () => {
      const doc = document.documentElement;
      const scrollY = window.scrollY || doc.scrollTop;
      const vh = window.innerHeight || 1;
      const full = Math.max(doc.scrollHeight, document.body.scrollHeight, 1);
      if (scrollY >= vh * HERO_RATIO) fireMilestone("hero");
      if ((scrollY + vh) / full >= END_RATIO) fireMilestone("end");
    };

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        measure();
      });
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });

    const onVisibility = () => {
      if (document.visibilityState === "hidden") pauseActive();
      else resumeActive();
    };
    document.addEventListener("visibilitychange", onVisibility);

    const io =
      typeof IntersectionObserver !== "undefined"
        ? new IntersectionObserver(
            (entries) => {
              for (const entry of entries) {
                if (!entry.isIntersecting) continue;
                const mark = (entry.target as HTMLElement).dataset.journey;
                const id = (entry.target as HTMLElement).id;
                if (mark === "packages" || id === "paket-secimi") {
                  fireMilestone("packages");
                }
                if (mark === "plato" || id === "plato-secimi") {
                  fireMilestone("plato");
                }
                if (mark === "continue") fireMilestone("continue");
              }
            },
            { threshold: 0.2 }
          )
        : null;

    const bindMarkers = () => {
      const nodes = [
        ...Array.from(document.querySelectorAll("[data-journey]")),
        document.getElementById("paket-secimi"),
        document.getElementById("plato-secimi"),
      ].filter((el): el is HTMLElement => Boolean(el));
      nodes.forEach((el) => io?.observe(el));
    };
    bindMarkers();
    const retry = window.setTimeout(bindMarkers, 800);

    const onPageHide = () => {
      const payload = leavePayload(pathname);
      trackFunnelEvent("PageLeave", { metadata: payload });
      trackFunnelEvent("SessionAbandoned", { metadata: payload });
      track("page_leave", payload);
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
      io?.disconnect();
      window.clearTimeout(retry);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [pathname]);

  return null;
}
