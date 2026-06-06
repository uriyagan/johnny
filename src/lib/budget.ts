import { createAdminClient } from "@/lib/supabase/admin";
import { getAdsProvider } from "@/lib/ads";

export type BudgetStatus = "no_cap" | "ok" | "warning" | "paused";

export interface BudgetResult {
  status: BudgetStatus;
  spend: number;
  cap: number | null;
}

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

/**
 * Pillar 1 — the anti-overspending engine. Computes current spend across the
 * user's connected accounts, records it, and (if the hard cap is hit) pauses
 * active campaigns and notifies the user. Uses the service-role client because
 * it writes to notifications (which clients may not insert) and runs from both
 * the manual "check now" action and the cron endpoint.
 */
export async function evaluateBudget(userId: string): Promise<BudgetResult> {
  const supabase = createAdminClient();
  const { data: cap } = await supabase
    .from("budget_caps")
    .select("*")
    .eq("user_id", userId)
    .is("ad_account_id", null)
    .maybeSingle();

  if (!cap) return { status: "no_cap", spend: 0, cap: null };

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("external_account_id")
    .eq("user_id", userId);
  const ids = (accounts ?? []).map((a) => a.external_account_id);

  let spend = 0;
  let ads: Awaited<ReturnType<typeof getAdsProvider>> | null = null;
  if (ids.length > 0) {
    try {
      ads = await getAdsProvider(userId);
      const accData = await Promise.all(ids.map((id) => ads!.getAccount(id)));
      spend = accData.reduce((sum, a) => sum + (a?.amountSpentThisMonth ?? 0), 0);
    } catch {
      return { status: "no_cap", spend: 0, cap: cap.monthly_cap_ils };
    }
  }

  await supabase
    .from("budget_caps")
    .update({ spend_current_period: spend })
    .eq("id", cap.id);

  const thresholdValue = cap.monthly_cap_ils * (cap.threshold_pct / 100);

  // Hard cap reached → pause active campaigns once.
  if (spend >= cap.monthly_cap_ils) {
    if (cap.hard_pause_enabled && !cap.triggered_at && ads) {
      const provider = ads;
      const campaigns = (
        await Promise.all(ids.map((id) => provider.listCampaigns(id)))
      ).flat();
      await Promise.all(
        campaigns
          .filter((c) => c.status === "active")
          .map((c) => provider.pauseCampaign(c.id)),
      );

      await supabase
        .from("budget_caps")
        .update({ triggered_at: new Date().toISOString() })
        .eq("id", cap.id);

      await supabase.from("notifications").insert({
        user_id: userId,
        type: "budget_paused",
        channel: "in_app",
        title: "הקמפיינים הושהו",
        body: `הגעת לתקרת התקציב החודשית (${ils.format(cap.monthly_cap_ils)}). השהינו את הקמפיינים כדי להגן עליך מהוצאה מיותרת.`,
      });
      await emailUser(userId, "budget_paused", {
        "budget.cap": ils.format(cap.monthly_cap_ils),
      });
    }
    return { status: "paused", spend, cap: cap.monthly_cap_ils };
  }

  // Threshold reached → warn (at most once per 12h to avoid spam).
  if (spend >= thresholdValue) {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString();
    const { count } = await supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("type", "budget_warning")
      .gte("created_at", cutoff);

    if (!count) {
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "budget_warning",
        channel: "in_app",
        title: "מתקרבים לתקרת התקציב",
        body: `ניצלת ${ils.format(spend)} מתוך ${ils.format(cap.monthly_cap_ils)} החודש.`,
      });
      await emailUser(userId, "budget_warning", {
        "budget.spent": ils.format(spend),
        "budget.cap": ils.format(cap.monthly_cap_ils),
      });
    }
    return { status: "warning", spend, cap: cap.monthly_cap_ils };
  }

  return { status: "ok", spend, cap: cap.monthly_cap_ils };
}

/** Best-effort transactional email to a user for a budget event. */
async function emailUser(
  userId: string,
  triggerKey: string,
  extra: Record<string, string>,
): Promise<void> {
  try {
    const { getRecipient } = await import("@/lib/email/recipient");
    const { sendAutomation } = await import("@/lib/email/send");
    const r = await getRecipient(userId);
    if (r.email) await sendAutomation(triggerKey, r.email, { ...r.ctx, ...extra });
  } catch {
    /* email is best-effort */
  }
}
