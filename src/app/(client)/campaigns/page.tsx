import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdsProvider } from "@/lib/ads";
import { getAIProvider } from "@/lib/ai";
import type { MetaCampaign, MetaCampaignStatus } from "@/lib/ads/types";
import type { RejectionExplanation } from "@/lib/ai/types";
import { pauseCampaign, resumeCampaign } from "@/lib/actions/campaigns";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const STATUS: Record<MetaCampaignStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "פעיל", tone: "green" },
  paused: { label: "מושהה", tone: "gray" },
  in_review: { label: "בבדיקה", tone: "yellow" },
  rejected: { label: "נדחה", tone: "red" },
  archived: { label: "בארכיון", tone: "gray" },
};

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export default async function CampaignsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("external_account_id, name")
    .eq("user_id", user.id);

  const accountName = new Map(
    (accounts ?? []).map((a) => [a.external_account_id, a.name ?? "חשבון"]),
  );

  if (accountName.size === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-8">
        <h1 className="text-2xl font-bold text-foreground">קמפיינים</h1>
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-2">חברו חשבון מודעות כדי לראות קמפיינים.</p>
          <Link
            href="/accounts"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            חיבור חשבון
          </Link>
        </div>
      </div>
    );
  }

  const ads = await getAdsProvider(user.id);
  const campaigns = (
    await Promise.all(
      [...accountName.keys()].map((id) => ads.listCampaigns(id)),
    )
  ).flat();

  // Pillar 3: translate rejection reasons to Hebrew for rejected campaigns.
  const ai = getAIProvider();
  const explanations = new Map<string, RejectionExplanation>();
  await Promise.all(
    campaigns
      .filter((c) => c.status === "rejected" && c.rejectionReason)
      .map(async (c) => {
        explanations.set(c.id, await ai.explainRejection(c.rejectionReason!));
      }),
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-foreground">קמפיינים</h1>
      <p className="mt-1 text-muted">כל הקמפיינים שלך במקום אחד.</p>

      <ul className="mt-6 space-y-3">
        {campaigns.map((c) => (
          <CampaignRow
            key={c.id}
            campaign={c}
            accountName={accountName.get(c.accountId) ?? "חשבון"}
            explanation={explanations.get(c.id)}
          />
        ))}
      </ul>
    </div>
  );
}

function CampaignRow({
  campaign: c,
  accountName,
  explanation,
}: {
  campaign: MetaCampaign;
  accountName: string;
  explanation?: RejectionExplanation;
}) {
  const s = STATUS[c.status];
  return (
    <li className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-medium text-foreground">{c.name}</p>
          <p className="text-xs text-muted-2">
            {accountName} · {c.objective}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-2">
            {ils.format(c.spend)} · {c.results} תוצאות
          </span>
          <Badge tone={s.tone}>{s.label}</Badge>
          {c.status === "active" && (
            <form action={pauseCampaign}>
              <input type="hidden" name="id" value={c.id} />
              <Button type="submit" variant="ghost" size="sm">
                השהיה
              </Button>
            </form>
          )}
          {c.status === "paused" && (
            <form action={resumeCampaign}>
              <input type="hidden" name="id" value={c.id} />
              <Button type="submit" variant="secondary" size="sm">
                הפעלה
              </Button>
            </form>
          )}
        </div>
      </div>

      {c.status === "rejected" && explanation && (
        <div className="mt-3 rounded-xl bg-red-500/10 p-3 text-sm">
          <p className="font-medium text-red-300">המודעה נדחתה</p>
          <p className="mt-1 text-red-300">{explanation.reasonHe}</p>
          {explanation.safeCopy.length > 0 && (
            <div className="mt-2">
              <p className="font-medium text-muted">הצעות לנוסח חדש:</p>
              <ul className="mt-1 space-y-1 text-muted">
                {explanation.safeCopy.map((copy) => (
                  <li key={copy}>• {copy}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
