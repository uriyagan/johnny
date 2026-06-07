import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { getAdsProvider } from "@/lib/ads";

export interface Recommendation {
  key: string;
  title: string;
  body: string;
  actionLabel: string;
  actionHref: string;
  external?: boolean;
}

export interface RecommendationSplit {
  active: Recommendation[];
  hidden: Recommendation[];
}

/** Marketing moments (Gregorian approximations) to proactively prepare for. */
const EVENTS: { key: string; name: string; month: number; day: number }[] = [
  { key: "valentine", name: "יום האהבה (ולנטיין)", month: 2, day: 14 },
  { key: "passover", name: "פסח", month: 4, day: 10 },
  { key: "summer_sale", name: "מבצעי קיץ", month: 7, day: 1 },
  { key: "back_to_school", name: "חזרה לבית הספר", month: 8, day: 25 },
  { key: "rosh_hashana", name: "ראש השנה", month: 9, day: 20 },
  { key: "singles_day", name: "יום הרווקים 11.11", month: 11, day: 11 },
  { key: "black_friday", name: "בלאק פריידי", month: 11, day: 28 },
  { key: "cyber_monday", name: "סייבר מאנדיי", month: 12, day: 1 },
  { key: "hanukkah", name: "חנוכה", month: 12, day: 20 },
];

/** The nearest upcoming event within `withinDays`, if any. */
function upcomingEvent(withinDays = 21) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let best: { key: string; name: string; days: number } | null = null;
  for (const e of EVENTS) {
    let d = new Date(now.getFullYear(), e.month - 1, e.day);
    if (d < today) d = new Date(now.getFullYear() + 1, e.month - 1, e.day);
    const days = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (days >= 0 && days <= withinDays && (!best || days < best.days)) {
      best = { key: e.key, name: e.name, days };
    }
  }
  return best;
}

/**
 * Personalized recommendation cards from account state, live campaigns,
 * brand profile, and the marketing calendar. Split into active vs. dismissed.
 */
export async function getRecommendations(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<RecommendationSplit> {
  const [{ data: accounts }, { data: cap }, { data: biz }, { data: dismissed }] =
    await Promise.all([
      supabase
        .from("ad_accounts")
        .select("external_account_id")
        .eq("user_id", userId)
        .is("deleted_at", null),
      supabase
        .from("budget_caps")
        .select("monthly_cap_ils, spend_current_period")
        .eq("user_id", userId)
        .is("ad_account_id", null)
        .maybeSingle(),
      supabase
        .from("business_profiles")
        .select("instagram_handle, logo_path")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("recommendation_dismissals")
        .select("rec_key")
        .eq("user_id", userId),
    ]);

  const ids = (accounts ?? []).map((a) => a.external_account_id);
  const hasAccount = ids.length > 0;
  const dismissedKeys = new Set((dismissed ?? []).map((d) => d.rec_key));
  const recs: Recommendation[] = [];

  // Live campaign state (best-effort).
  let activeCount = 0;
  let rejectedCount = 0;
  let totalSpend = 0;
  if (hasAccount) {
    try {
      const ads = await getAdsProvider(userId);
      const lists = await Promise.all(ids.map((id) => ads.listCampaigns(id)));
      const campaigns = lists.flat();
      activeCount = campaigns.filter((c) => c.status === "active").length;
      rejectedCount = campaigns.filter((c) => c.status === "rejected").length;
      totalSpend = campaigns.reduce((s, c) => s + c.spend, 0);
    } catch {
      /* not connected / token issue */
    }
  }

  // --- Account-state rules ---
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
      body: "מודעות שרצות גם באינסטגרם מגיעות ליותר אנשים. כדאי לפתוח ולחבר חשבון.",
      actionLabel: "לפתיחת חשבון",
      actionHref: "https://www.instagram.com/accounts/emailsignup/",
      external: true,
    });
  }
  if (!biz?.logo_path) {
    recs.push({
      key: "upload_logo",
      title: "העלו את הלוגו שלכם",
      body: "לוגו עוזר לי ליצור מודעות במראה מקצועי ואחיד למותג שלכם.",
      actionLabel: "לעדכון הפרופיל",
      actionHref: "/onboarding",
    });
  }

  // --- Campaign-based rules ---
  if (hasAccount && activeCount === 0) {
    recs.push({
      key: "no_active_campaigns",
      title: "אין קמפיינים פעילים",
      body: "בואו ניצור קמפיין חדש שיתחיל להביא לכם לקוחות.",
      actionLabel: "בניית קמפיין",
      actionHref: "/chat?new=campaign",
    });
  }
  if (rejectedCount > 0) {
    recs.push({
      key: "fix_rejected",
      title: "יש מודעה שנדחתה",
      body: "הכנתי הסבר בעברית ונוסח חלופי בטוח — בואו נתקן ונעלה מחדש.",
      actionLabel: "לצפייה בקמפיינים",
      actionHref: "/campaigns",
    });
  }
  if (
    hasAccount &&
    activeCount > 0 &&
    cap &&
    cap.monthly_cap_ils > 0 &&
    totalSpend < cap.monthly_cap_ils * 0.5
  ) {
    recs.push({
      key: "room_to_scale",
      title: "יש מקום להגדיל",
      body: "אתם הרבה מתחת לתקרת התקציב — אפשר להגדיל בזהירות קמפיין שעובד טוב.",
      actionLabel: "לצפייה בקמפיינים",
      actionHref: "/campaigns",
    });
  }

  // --- Seasonal / calendar rule (nearest upcoming event) ---
  const ev = upcomingEvent();
  if (ev && hasAccount) {
    recs.push({
      key: `season_${ev.key}`,
      title: `מתקרב ${ev.name} 🎉`,
      body: `עוד כ‑${ev.days} ימים. זה זמן מצוין להכין קמפיין מיוחד — בואו נתחיל מבעוד מועד.`,
      actionLabel: "בניית קמפיין למועד",
      actionHref: "/chat?new=campaign",
    });
  }

  return {
    active: recs.filter((r) => !dismissedKeys.has(r.key)),
    hidden: recs.filter((r) => dismissedKeys.has(r.key)),
  };
}
