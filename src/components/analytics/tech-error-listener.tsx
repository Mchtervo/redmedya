"use client";

import { useEffect } from "react";
import { trackTechErrorClient } from "@/lib/analytics/client";
import { isIgnorableClientError } from "@/lib/meta-pixel-bridge";

/** Global JS / resource hatalarını anonim session ile kaydet (PII yok). */
export function TechErrorListener() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      const message = event.message || "Error";
      if (isIgnorableClientError(message)) return;
      trackTechErrorClient({
        error_type: "js_runtime",
        message,
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
      if (isIgnorableClientError(msg)) return;
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
