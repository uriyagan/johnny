import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdsProvider } from "@/lib/ads";
import { startCheckin, submitFeedback } from "@/lib/actions/crm";
import { Button } from "@/components/ui/button";
import type { FeedbackAnalysis } from "@/lib/ai/types";

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

  const ads = getAdsProvider();
  const [accountData, campaignLists] = await Promise.all([
    Promise.all(ids.map((id) => ads.getAccount(id))),
    Promise.all(ids.map((id) => ads.listCampaigns(id))),
  ]);

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

  const name = profile?.full_name?.split(" ")[0] || "ברוך הבא";
  const cards = [
    { label: "חשבונות מודעות", value: String(ids.length) },
    { label: "קמפיינים פעילים", value: String(activeCampaigns) },
    { label: "הוצאה החודש", value: ils.format(spentThisMonth) },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900">שלום, {name} 👋</h1>
      <p className="mt-1 text-gray-600">
        {profile?.business_name
          ? `נהל את הקמפיינים של ${profile.business_name} בקלות.`
          : "נהל את הקמפיינים שלך בקלות."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Lead-quality check-in (Pillar 5) */}
      {ids.length > 0 && (
        <section className="mt-8 max-w-2xl rounded-2xl border border-gray-200 bg-white p-5">
          {openCheckin ? (
            <>
              <h2 className="font-semibold text-gray-900">שאלה קטנה 💬</h2>
              <p className="mt-1 text-gray-600">{openCheckin.question}</p>
              <form action={submitFeedback} className="mt-3">
                <input type="hidden" name="id" value={openCheckin.id} />
                <textarea
                  name="response"
                  required
                  rows={3}
                  placeholder="כתבו לי במילים שלכם…"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
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
              <h2 className="font-semibold text-gray-900">איך הלידים שלך?</h2>
              <p className="mt-1 text-gray-600">
                ספרו לי איך הפניות האחרונות — ואכוונן את הקמפיינים בהתאם.
              </p>
              {lastAnalysis && (
                <div className="mt-3 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
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
