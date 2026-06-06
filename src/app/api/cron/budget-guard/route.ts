import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { evaluateBudget } from "@/lib/budget";

/**
 * Budget-guard cron endpoint (Pillar 1). Invoked periodically by a Cloudflare
 * Worker with the `x-cron-secret` header. Iterates every user that has a cap
 * and evaluates their spend, pausing campaigns when the hard cap is hit.
 */
export async function POST(request: NextRequest) {
  const { CRON_SECRET } = serverEnv();
  if (!CRON_SECRET || request.headers.get("x-cron-secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: caps } = await admin
    .from("budget_caps")
    .select("user_id")
    .is("ad_account_id", null);

  const userIds = [...new Set((caps ?? []).map((c) => c.user_id))];

  const results = [];
  for (const userId of userIds) {
    const result = await evaluateBudget(userId);
    results.push({ userId, ...result });
  }

  return NextResponse.json({ checked: userIds.length, results });
}
