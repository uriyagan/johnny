import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export interface Recommendation {
  key: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
  external?: boolean;
}

/**
 * Computes the active recommendation cards for a user from their current state,
 * excluding ones they've dismissed. Rules are intentionally simple to extend.
 */
export async function getRecommendations(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<Recommendation[]> {
  const [{ count: accountCount }, { data: cap }, { data: biz }, { data: dismissed }] =
    await Promise.all([
      supabase
        .from("ad_accounts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("budget_caps")
        .select("id")
        .eq("user_id", userId)
        .is("ad_account_id", null)
        .maybeSingle(),
      supabase
        .from("business_profiles")
        .select("instagram_handle, website")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("recommendation_dismissals")
        .select("rec_key")
        .eq("user_id", userId),
    ]);

  const hasAccount = (accountCount ?? 0) > 0;
  const dismissedKeys = new Set((dismissed ?? []).map((d) => d.rec_key));
  const recs: Recommendation[] = [];

  if (!hasAccount) {
    recs.push({
      key: "connect_account",
      title: "חברו חשבון מודעות",
      body: "כדי שאוכל לנהל ולפרסם עבורכם, צריך לחבר חשבון מודעות של Meta.",
      actionLabel: "חיבור חשבון",
      actionHref: "/accounts",
    });
  }

  if (hasAccount && !cap) {
    recs.push({
      key: "set_budget",
      title: "הגדירו תקרת תקציב חודשית",
      body: "כך אעצור אוטומטית את הקמפיינים לפני שתוציאו יותר ממה שתכננתם.",
      actionLabel: "הגדרת תקציב",
      actionHref: "/settings",
    });
  }

  if (hasAccount && !biz?.instagram_handle) {
    recs.push({
      key: "open_instagram",
      title: "שקלו לפתוח חשבון אינסטגרם",
      body: "מודעות שרצות גם באינסטגרם מגיעות ליותר אנשים. כדאי לפתוח חשבון ולחבר אותו.",
      actionLabel: "לפתיחת חשבון",
      actionHref: "https://www.instagram.com/accounts/emailsignup/",
      external: true,
    });
  }

  return recs.filter((r) => !dismissedKeys.has(r.key));
}
