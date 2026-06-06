import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdsProvider } from "@/lib/ads";

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
    </div>
  );
}
