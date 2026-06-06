import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";
import { CHECKIN_QUESTION, CHECKIN_INTERVAL_DAYS } from "@/lib/crm";

/**
 * CRM check-in cron (Pillar 5). Invoked by the Cloudflare Worker. Opens a new
 * lead-quality check-in for each user who has connected accounts, has no open
 * check-in, and hasn't completed one within CHECKIN_INTERVAL_DAYS.
 */
export async function POST(request: NextRequest) {
  const { CRON_SECRET } = serverEnv();
  if (!CRON_SECRET || request.headers.get("x-cron-secret") !== CRON_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: accounts } = await admin
    .from("ad_accounts")
    .select("user_id");
  const userIds = [...new Set((accounts ?? []).map((a) => a.user_id))];

  const intervalMs = CHECKIN_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
  let created = 0;

  for (const userId of userIds) {
    const { data: open } = await admin
      .from("crm_feedback")
      .select("id")
      .eq("user_id", userId)
      .is("completed_at", null)
      .maybeSingle();
    if (open) continue;

    const { data: last } = await admin
      .from("crm_feedback")
      .select("completed_at")
      .eq("user_id", userId)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const due =
      !last?.completed_at ||
      Date.now() - new Date(last.completed_at).getTime() > intervalMs;
    if (!due) continue;

    await admin.from("crm_feedback").insert({
      user_id: userId,
      question: CHECKIN_QUESTION,
      scheduled_for: new Date().toISOString(),
    });
    created++;
  }

  return NextResponse.json({ created });
}
