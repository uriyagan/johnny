"use client";

import { useEffect } from "react";
import { reportClientError } from "@/lib/report-error";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    reportClientError({
      message: error.message || "Global error",
      stack: error.stack,
      severity: "fatal",
      metadata: { digest: error.digest },
    });
  }, [error]);

  return (
    <html lang="he" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <h1 className="text-xl font-bold">משהו השתבש</h1>
          <p className="mt-2 text-muted">נסו שוב בעוד רגע.</p>
          <button
            onClick={reset}
            className="mt-4 rounded-lg bg-emerald-600 px-5 py-2 text-sm font-medium text-white hover:bg-emerald-700"
          >
            ניסיון חוזר
          </button>
        </div>
      </body>
    </html>
  );
}
