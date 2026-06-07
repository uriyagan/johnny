import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdsProvider } from "@/lib/ads";
import { startCheckin, submitFeedback } from "@/lib/actions/crm";
import { dismissRecommendation } from "@/lib/actions/recommendations";
import { getRecommendations } from "@/lib/recommendations";
import { Button } from "@/components/ui/button";
import type { FeedbackAnalysis } from "@/lib/ai/types";
import type { MetaAdAccount, MetaCampaign } from "@/lib/ads/types";

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", user.id)
    .single();

  // Stats are derived from the user's CONNECTED accounts, enriched via the
  // Ads provider (mock until live tokens are connected).
  const { data: connected } = await supabase
    .from("ad_accounts")
    .select("external_account_id")
    .eq("user_id", user.id);
  const ids = (connected ?? []).map((r) => r.external_account_id);

  let accountData: (MetaAdAccount | null)[] = [];
  let campaignLists: MetaCampaign[][] = [];
  if (ids.length > 0) {
    try {
      const ads = await getAdsProvider(user.id);
      [accountData, campaignLists] = await Promise.all([
        Promise.all(ids.map((id) => ads.getAccount(id))),
        Promise.all(ids.map((id) => ads.listCampaigns(id))),
      ]);
    } catch {
      // Not connected yet / token issue — show zeros rather than crash.
    }
  }

  const campaigns = campaignLists.flat();
  const activeCampaigns = campaigns.filter((c) => c.status === "active").length;
  const spentThisMonth = accountData.reduce(
    (sum, a) => sum + (a?.amountSpentThisMonth ?? 0),
    0,
  );

  // Pillar 5 — lead-quality check-in.
  const { data: openCheckin } = await supabase
    .from("crm_feedback")
    .select("id, question")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: lastCheckin } = await supabase
    .from("crm_feedback")
    .select("gemini_analysis")
    .eq("user_id", user.id)
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastAnalysis = (lastCheckin?.gemini_analysis ??
    null) as unknown as FeedbackAnalysis | null;

  // Budget cap (for the guided checklist) + recommendation cards.
  const { data: capRow } = await supabase
    .from("budget_caps")
    .select("id")
    .eq("user_id", user.id)
    .is("ad_account_id", null)
    .maybeSingle();
  const recommendations = await getRecommendations(supabase, user.id);

  const steps = [
    { label: "השלמת פרטי העסק", done: true, href: "/onboarding", cta: "עריכה" },
    {
      label: "חיבור חשבון מודעות",
      done: ids.length > 0,
      href: "/accounts",
      cta: "חיבור",
    },
    {
      label: "הגדרת תקרת תקציב",
      done: !!capRow,
      href: "/settings",
      cta: "הגדרה",
    },
    {
      label: "יצירת הקמפיין הראשון",
      done: campaigns.length > 0,
      href: "/campaigns/new",
      cta: "יצירה עם ג׳וני",
    },
  ];
  const nextStep = steps.find((s) => !s.done);

  const name = profile?.full_name?.split(" ")[0] || "ברוך הבא";
  const cards = [
    { label: "חשבונות מודעות", value: String(ids.length) },
    { label: "קמפיינים פעילים", value: String(activeCampaigns) },
    { label: "הוצאה החודש", value: ils.format(spentThisMonth) },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-foreground">שלום, {name} 👋</h1>
      <p className="mt-1 text-muted">
        {profile?.business_name
          ? `נהל את הקמפיינים של ${profile.business_name} בקלות.`
          : "נהל את הקמפיינים שלך בקלות."}
      </p>

      {/* Guided steps */}
      <section className="mt-6 max-w-2xl rounded-2xl border border-border bg-surface p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-foreground">השלבים שלך</h2>
          {nextStep && (
            <Link
              href={nextStep.href}
              className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
            >
              המשך: {nextStep.label}
            </Link>
          )}
        </div>
        <ol className="mt-4 space-y-2">
          {steps.map((s) => (
            <li
              key={s.label}
              className="flex items-center justify-between gap-3 rounded-lg bg-surface-2 px-4 py-3"
            >
              <span className="flex items-center gap-3">
                <span
                  className={
                    s.done
                      ? "flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-xs text-white"
                      : "flex h-6 w-6 items-center justify-center rounded-full border border-border text-xs text-muted-2"
                  }
                >
                  {s.done ? "✓" : ""}
                </span>
                <span
                  className={s.done ? "text-muted-2 line-through" : "text-foreground"}
                >
                  {s.label}
                </span>
              </span>
              {!s.done && (
                <Link
                  href={s.href}
                  className="text-sm font-medium text-emerald-400 hover:underline"
                >
                  {s.cta}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </section>

      {/* Recommendation cards */}
      {recommendations.length > 0 && (
        <section className="mt-6 max-w-2xl space-y-3">
          <h2 className="font-semibold text-foreground">המלצות בשבילך</h2>
          {recommendations.map((r) => (
            <div
              key={r.key}
              className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-4"
            >
              <p className="font-medium text-foreground">{r.title}</p>
              <p className="mt-1 text-sm text-muted">{r.body}</p>
              <div className="mt-3 flex items-center gap-2">
                {r.external ? (
                  <a
                    href={r.actionHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    {r.actionLabel}
                  </a>
                ) : (
                  <Link
                    href={r.actionHref}
                    className="inline-flex h-9 items-center rounded-lg bg-emerald-600 px-4 text-sm font-medium text-white hover:bg-emerald-700"
                  >
                    {r.actionLabel}
                  </Link>
                )}
                <form action={dismissRecommendation}>
                  <input type="hidden" name="rec_key" value={r.key} />
                  <Button type="submit" variant="ghost" size="sm">
                    התעלם
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </section>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-sm text-muted-2">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Lead-quality check-in (Pillar 5) */}
      {ids.length > 0 && (
        <section className="mt-8 max-w-2xl rounded-2xl border border-border bg-surface p-5">
          {openCheckin ? (
            <>
              <h2 className="font-semibold text-foreground">שאלה קטנה 💬</h2>
              <p className="mt-1 text-muted">{openCheckin.question}</p>
              <form action={submitFeedback} className="mt-3">
                <input type="hidden" name="id" value={openCheckin.id} />
                <textarea
                  name="response"
                  required
                  rows={3}
                  placeholder="כתבו לי במילים שלכם…"
                  className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="mt-2">
                  <Button type="submit" size="sm">
                    שליחה
                  </Button>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-foreground">איך הלידים שלך?</h2>
              <p className="mt-1 text-muted">
                ספרו לי איך הפניות האחרונות — ואכוונן את הקמפיינים בהתאם.
              </p>
              {lastAnalysis && (
                <div className="mt-3 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">
                  <p className="font-medium">מה עשינו לפי המשוב האחרון:</p>
                  <ul className="mt-1 space-y-1">
                    {lastAnalysis.adjustments.map((adj) => (
                      <li key={adj}>• {adj}</li>
                    ))}
                  </ul>
                </div>
              )}
              <form action={startCheckin} className="mt-3">
                <Button type="submit" variant="secondary" size="sm">
                  שיתוף משוב
                </Button>
              </form>
            </>
          )}
        </section>
      )}
    </div>
  );
}
