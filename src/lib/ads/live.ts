import "server-only";
import { graphGet, graphPost } from "@/lib/meta/graph";
import type { AdsProvider } from "./provider";
import type {
  CreateCampaignInput,
  MetaAdAccount,
  MetaCampaign,
  MetaCampaignStatus,
  MetaInsights,
  MetaPage,
} from "./types";

/** Account fields & budgets come back in currency MINOR units (e.g. agorot). */
const minor = (v: unknown) => Number(v ?? 0) / 100;
/** Insights spend comes back as a decimal string in MAJOR units. */
const major = (v: unknown) => Number(v ?? 0);

type ActionStat = { action_type: string; value: string };

function countResults(actions?: ActionStat[]): number {
  if (!actions) return 0;
  return actions
    .filter((a) => /lead|purchase|complete_registration/i.test(a.action_type))
    .reduce((sum, a) => sum + Number(a.value ?? 0), 0);
}

function mapStatus(effective: string): MetaCampaignStatus {
  switch (effective) {
    case "ACTIVE":
      return "active";
    case "PAUSED":
    case "CAMPAIGN_PAUSED":
      return "paused";
    case "ARCHIVED":
    case "DELETED":
      return "archived";
    case "PENDING_REVIEW":
    case "IN_PROCESS":
    case "PREAPPROVED":
      return "in_review";
    case "DISAPPROVED":
      return "rejected";
    default:
      return "paused";
  }
}

/** Live Meta Ads provider, bound to a single user's access token. */
export class LiveAdsProvider implements AdsProvider {
  readonly name = "meta" as const;

  constructor(private readonly token: string) {}

  async listAccounts(): Promise<MetaAdAccount[]> {
    const data = await graphGet<{ data: RawAccount[] }>("me/adaccounts", this.token, {
      fields: "account_id,name,account_status,currency,amount_spent,spend_cap",
      limit: 100,
    });
    return (data.data ?? []).map((a) => this.toAccount(a, minor(a.amount_spent)));
  }

  async getAccount(accountId: string): Promise<MetaAdAccount | null> {
    const a = await graphGet<RawAccount>(accountId, this.token, {
      fields: "account_id,name,account_status,currency,amount_spent,spend_cap",
    }).catch(() => null);
    if (!a) return null;

    // Accurate month-to-date spend via insights.
    let monthSpend = minor(a.amount_spent);
    try {
      const ins = await graphGet<{ data: { spend?: string }[] }>(
        `${accountId}/insights`,
        this.token,
        { date_preset: "this_month", fields: "spend" },
      );
      if (ins.data?.[0]?.spend !== undefined) monthSpend = major(ins.data[0].spend);
    } catch {
      /* fall back to lifetime amount_spent */
    }
    return this.toAccount(a, monthSpend);
  }

  async listCampaigns(accountId: string): Promise<MetaCampaign[]> {
    const camps = await graphGet<{ data: RawCampaign[] }>(
      `${accountId}/campaigns`,
      this.token,
      {
        fields:
          "id,name,status,effective_status,objective,daily_budget,lifetime_budget,created_time",
        limit: 100,
      },
    );

    const insightsById = new Map<string, RawCampaignInsight>();
    try {
      const ins = await graphGet<{ data: RawCampaignInsight[] }>(
        `${accountId}/insights`,
        this.token,
        {
          level: "campaign",
          date_preset: "this_month",
          fields: "campaign_id,spend,reach,actions",
          limit: 200,
        },
      );
      for (const row of ins.data ?? []) insightsById.set(row.campaign_id, row);
    } catch {
      /* insights may be empty for new accounts */
    }

    return (camps.data ?? []).map((c) =>
      this.toCampaign(accountId, c, insightsById.get(c.id)),
    );
  }

  async getCampaign(campaignId: string): Promise<MetaCampaign | null> {
    const c = await graphGet<RawCampaign>(campaignId, this.token, {
      fields:
        "id,name,status,effective_status,objective,daily_budget,lifetime_budget,account_id,created_time",
    }).catch(() => null);
    if (!c) return null;
    return this.toCampaign(c.account_id ? `act_${c.account_id}` : "", c, undefined);
  }

  async pauseCampaign(campaignId: string): Promise<MetaCampaign> {
    await graphPost(campaignId, this.token, { status: "PAUSED" });
    const c = await this.getCampaign(campaignId);
    if (!c) throw new Error(`campaign ${campaignId} not found`);
    return c;
  }

  async resumeCampaign(campaignId: string): Promise<MetaCampaign> {
    await graphPost(campaignId, this.token, { status: "ACTIVE" });
    const c = await this.getCampaign(campaignId);
    if (!c) throw new Error(`campaign ${campaignId} not found`);
    return c;
  }

  async getInsights(campaignId: string): Promise<MetaInsights> {
    const ins = await graphGet<{ data: RawCampaignInsight[] }>(
      `${campaignId}/insights`,
      this.token,
      {
        date_preset: "this_month",
        fields: "spend,impressions,reach,clicks,actions",
      },
    );
    const row = ins.data?.[0];
    const spend = major(row?.spend);
    const results = countResults(row?.actions);
    return {
      campaignId,
      spend,
      impressions: Number(row?.impressions ?? 0),
      reach: Number(row?.reach ?? 0),
      clicks: Number(row?.clicks ?? 0),
      results,
      costPerResult: results > 0 ? +(spend / results).toFixed(2) : 0,
      period: { start: "", end: "" },
    };
  }

  async listPages(): Promise<MetaPage[]> {
    const data = await graphGet<{ data: { id: string; name: string }[] }>(
      "me/accounts",
      this.token,
      { fields: "id,name", limit: 100 },
    );
    return (data.data ?? []).map((p) => ({ id: p.id, name: p.name }));
  }

  async createCampaign(
    input: CreateCampaignInput,
  ): Promise<{ campaignId: string }> {
    const acct = input.accountId;

    // 1) Campaign — traffic objective avoids needing a pixel; always PAUSED.
    const campaign = await graphPost<{ id: string }>(
      `${acct}/campaigns`,
      this.token,
      {
        name: input.name,
        objective: "OUTCOME_TRAFFIC",
        status: "PAUSED",
        special_ad_categories: "[]",
      },
    );

    // 2) Ad set — budget, audience, optimize for link clicks.
    const startTime = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const targeting = JSON.stringify({
      geo_locations: { countries: input.audience.countries },
      age_min: input.audience.ageMin,
      age_max: input.audience.ageMax,
    });
    const adset = await graphPost<{ id: string }>(`${acct}/adsets`, this.token, {
      name: `${input.name} — סט מודעות`,
      campaign_id: campaign.id,
      daily_budget: Math.round(input.dailyBudgetIls * 100),
      billing_event: "IMPRESSIONS",
      optimization_goal: "LINK_CLICKS",
      bid_strategy: "LOWEST_COST_WITHOUT_CAP",
      targeting,
      start_time: startTime,
      status: "PAUSED",
    });

    // 3) Creative — link ad tied to the chosen Page.
    const linkData: Record<string, unknown> = {
      message: input.primaryText,
      link: input.linkUrl,
      name: input.headline,
      description: input.description,
      call_to_action: {
        type: input.callToAction,
        value: { link: input.linkUrl },
      },
    };
    if (input.imageUrl) linkData.picture = input.imageUrl;

    const creative = await graphPost<{ id: string }>(
      `${acct}/adcreatives`,
      this.token,
      {
        name: `${input.name} — קריאייטיב`,
        object_story_spec: JSON.stringify({
          page_id: input.pageId,
          link_data: linkData,
        }),
      },
    );

    // 4) Ad — PAUSED.
    await graphPost<{ id: string }>(`${acct}/ads`, this.token, {
      name: input.name,
      adset_id: adset.id,
      creative: JSON.stringify({ creative_id: creative.id }),
      status: "PAUSED",
    });

    return { campaignId: campaign.id };
  }

  private toAccount(a: RawAccount, amountSpentThisMonth: number): MetaAdAccount {
    return {
      id: a.account_id ? `act_${a.account_id}` : "",
      name: a.name ?? "חשבון מודעות",
      currency: a.currency ?? "ILS",
      status: a.account_status === 1 ? "active" : "disabled",
      spendCap: a.spend_cap ? minor(a.spend_cap) : null,
      amountSpentThisMonth,
    };
  }

  private toCampaign(
    accountId: string,
    c: RawCampaign,
    ins: RawCampaignInsight | undefined,
  ): MetaCampaign {
    const status = mapStatus(c.effective_status ?? c.status ?? "");
    return {
      id: c.id,
      accountId,
      name: c.name,
      status,
      objective: c.objective ?? "",
      dailyBudget: c.daily_budget ? minor(c.daily_budget) : null,
      lifetimeBudget: c.lifetime_budget ? minor(c.lifetime_budget) : null,
      spend: major(ins?.spend),
      results: countResults(ins?.actions),
      reach: Number(ins?.reach ?? 0),
      rejectionReason:
        status === "rejected" ? "Ad was disapproved by Meta policy review." : null,
      createdAt: c.created_time ?? new Date().toISOString(),
    };
  }
}

type RawAccount = {
  account_id?: string;
  name?: string;
  account_status?: number;
  currency?: string;
  amount_spent?: string;
  spend_cap?: string;
};

type RawCampaign = {
  id: string;
  name: string;
  status?: string;
  effective_status?: string;
  objective?: string;
  daily_budget?: string;
  lifetime_budget?: string;
  account_id?: string;
  created_time?: string;
};

type RawCampaignInsight = {
  campaign_id: string;
  spend?: string;
  reach?: string;
  impressions?: string;
  clicks?: string;
  actions?: ActionStat[];
};
