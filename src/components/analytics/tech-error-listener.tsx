"use client";

import { useEffect } from "react";
import { trackTechErrorClient } from "@/lib/analytics/client";

/** Global JS / resource hatalarını anonim session ile kaydet (PII yok). */
export function TechErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      trackTechErrorClient({
        error_type: "js_runtime",
        message: event.message || "Error",
        stack: event.error instanceof Error ? event.error.stack : undefined,
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      const msg =
        reason instanceof Error
          ? reason.message
          : typeof reason === "string"
            ? reason
            : "unhandledrejection";
      trackTechErrorClient({
        error_type: "unhandled_rejection",
        message: msg,
        stack: reason instanceof Error ? reason.stack : undefined,
      });
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
