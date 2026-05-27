"use client";

import { Suspense, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { gtagPageView } from "@/lib/gtag";

function GA4PageTrackerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;

    const query = searchParams.toString();
    const path = query ? `${pathname}?${query}` : pathname;

    gtagPageView(path);
  }, [pathname, searchParams]);

  return null;
}

/** App Router route değişimlerinde GA4 page_view */
export function GA4PageTracker() {
  return (
    <Suspense fallback={null}>
      <GA4PageTrackerInner />
    </Suspense>
  );
}
