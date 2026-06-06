import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type Severity = Database["public"]["Enums"]["error_severity"];

const cap = (s: unknown, n: number) =>
  typeof s === "string" && s ? s.slice(0, n) : null;

/** Receives client-side error reports and stores them in app_errors. */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown> = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const message = cap(body.message, 2000);
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  // Attach the current user if there's a session.
  let userId: string | null = null;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  } catch {
    /* anonymous */
  }

  const severity = (["warning", "error", "fatal"] as Severity[]).includes(
    body.severity as Severity,
  )
    ? (body.severity as Severity)
    : "error";

  try {
    const admin = createAdminClient();
    await admin.from("app_errors").insert({
      source: "client",
      severity,
      message,
      stack: cap(body.stack, 8000),
      route: cap(body.route, 500),
      user_id: userId,
      user_agent: cap(request.headers.get("user-agent"), 500),
      metadata: (body.metadata ?? {}) as Json,
    });
  } catch {
    // never cascade
  }

  return NextResponse.json({ ok: true });
}
