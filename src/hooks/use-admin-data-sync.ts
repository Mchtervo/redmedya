"use client";

import { useEffect } from "react";
import { ADMIN_DATA_CHANGED } from "@/lib/admin-data-sync";

export function useAdminDataSync(onRefresh: () => void) {
  useEffect(() => {
    const handler = () => onRefresh();
    window.addEventListener(ADMIN_DATA_CHANGED, handler);
    return () => window.removeEventListener(ADMIN_DATA_CHANGED, handler);
  }, [onRefresh]);
}
