import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type Severity = Database["public"]["Enums"]["error_severity"];

const cap = (s: string | undefined, n: number) =>
  s ? s.slice(0, n) : undefined;

/**
 * Records a server-side error to app_errors. Never throws (logging must not
 * cascade into another failure).
 */
export async function logServerError(
  error: unknown,
  ctx: {
    route?: string;
    userId?: string | null;
    severity?: Severity;
    metadata?: Record<string, unknown>;
  } = {},
): Promise<void> {
  try {
    const err = error as { message?: string; stack?: string };
    const admin = createAdminClient();
    await admin.from("app_errors").insert({
      source: "server",
      severity: ctx.severity ?? "error",
      message: cap(err?.message ?? String(error), 2000) ?? "unknown error",
      stack: cap(err?.stack, 8000) ?? null,
      route: ctx.route ?? null,
      user_id: ctx.userId ?? null,
      metadata: (ctx.metadata ?? {}) as Json,
    });
  } catch {
    // swallow — logging failures must never propagate
  }
}
