"use client";

import { useEffect, useState } from "react";
import { getDefaultSiteSettings } from "@/lib/site-settings-defaults";
import type { SiteSettings } from "@/types/site-settings";

type PublicSettings = Pick<
  SiteSettings,
  "capacity" | "seasonalRules" | "blockedDates" | "caseStudies" | "social"
>;

export function useSiteSettings() {
  const [settings, setSettings] = useState<PublicSettings>(() => {
    const d = getDefaultSiteSettings();
    return {
      capacity: d.capacity,
      seasonalRules: d.seasonalRules,
      blockedDates: d.blockedDates,
      caseStudies: d.caseStudies,
      social: d.social,
    };
  });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/public/site-settings")
      .then((r) => r.json())
      .then((data) => {
        setSettings(data);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return { settings, loaded };
}
