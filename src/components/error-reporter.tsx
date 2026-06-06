"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

/**
 * Mounts global listeners that forward uncaught errors and unhandled promise
 * rejections to the error log. Rendered once in the root layout.
 */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportClientError({
        message: event.message || "Uncaught error",
        stack: event.error?.stack,
        severity: "error",
      });
    };
    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason as { message?: string; stack?: string };
      reportClientError({
        message: reason?.message || "Unhandled promise rejection",
        stack: reason?.stack,
        severity: "error",
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
