/** Client-side helper: best-effort POST an error to /api/errors. */
export function reportClientError(input: {
  message: string;
  stack?: string;
  severity?: "warning" | "error" | "fatal";
  metadata?: Record<string, unknown>;
}): void {
  try {
    const body = JSON.stringify({
      ...input,
      route: typeof window !== "undefined" ? window.location.pathname : undefined,
    });
    fetch("/api/errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* ignore */
  }
}
