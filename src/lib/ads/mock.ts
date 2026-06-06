import type { AdsProvider } from "./provider";
import type { MetaAdAccount, MetaCampaign, MetaInsights } from "./types";

/** Simulated network latency so loading states are exercised in the UI. */
const delay = (ms = 250) => new Promise((r) => setTimeout(r, ms));

const ACCOUNTS: MetaAdAccount[] = [
  {
    id: "act_1029384756",
    name: "חנות הפרחים של רותי",
    currency: "ILS",
    status: "active",
    spendCap: 5000,
    amountSpentThisMonth: 1840.5,
  },
  {
    id: "act_5647382910",
    name: "מסעדת הזית",
    currency: "ILS",
    status: "active",
    spendCap: null,
    amountSpentThisMonth: 920,
  },
];

const CAMPAIGNS: MetaCampaign[] = [
  {
    id: "cmp_001",
    accountId: "act_1029384756",
    name: "מבצע יום האהבה",
    status: "active",
    objective: "מכירות",
    dailyBudget: 80,
    lifetimeBudget: null,
    spend: 640.25,
    results: 37,
    reach: 12450,
    rejectionReason: null,
    createdAt: "2026-05-20T09:00:00.000Z",
  },
  {
    id: "cmp_002",
    accountId: "act_1029384756",
    name: "זרים לכל אירוע",
    status: "paused",
    objective: "תנועה לאתר",
    dailyBudget: 50,
    lifetimeBudget: null,
    spend: 320,
    results: 14,
    reach: 6800,
    rejectionReason: null,
    createdAt: "2026-05-12T09:00:00.000Z",
  },
  {
    id: "cmp_003",
    accountId: "act_1029384756",
    name: "פרחים ליום הזיכרון",
    status: "rejected",
    objective: "מכירות",
    dailyBudget: 60,
    lifetimeBudget: null,
    spend: 0,
    results: 0,
    reach: 0,
    rejectionReason:
      "Ad contains content related to sensitive social issues without authorization.",
    createdAt: "2026-05-25T09:00:00.000Z",
  },
  {
    id: "cmp_101",
    accountId: "act_5647382910",
    name: "תפריט עסקיות צהריים",
    status: "active",
    objective: "הודעות",
    dailyBudget: 40,
    lifetimeBudget: null,
    spend: 410,
    results: 52,
    reach: 9300,
    rejectionReason: null,
    createdAt: "2026-05-18T09:00:00.000Z",
  },
];

export class MockAdsProvider implements AdsProvider {
  readonly name = "meta" as const;

  // Clone so callers can't mutate the seed data directly.
  private accounts = ACCOUNTS.map((a) => ({ ...a }));
  private campaigns = CAMPAIGNS.map((c) => ({ ...c }));

  async listAccounts(): Promise<MetaAdAccount[]> {
    await delay();
    return this.accounts.map((a) => ({ ...a }));
  }

  async getAccount(accountId: string): Promise<MetaAdAccount | null> {
    await delay();
    const a = this.accounts.find((x) => x.id === accountId);
    return a ? { ...a } : null;
  }

  async listCampaigns(accountId: string): Promise<MetaCampaign[]> {
    await delay();
    return this.campaigns
      .filter((c) => c.accountId === accountId)
      .map((c) => ({ ...c }));
  }

  async getCampaign(campaignId: string): Promise<MetaCampaign | null> {
    await delay();
    const c = this.campaigns.find((x) => x.id === campaignId);
    return c ? { ...c } : null;
  }

  async pauseCampaign(campaignId: string): Promise<MetaCampaign> {
    await delay();
    return this.setStatus(campaignId, "paused");
  }

  async resumeCampaign(campaignId: string): Promise<MetaCampaign> {
    await delay();
    return this.setStatus(campaignId, "active");
  }

  async getInsights(campaignId: string): Promise<MetaInsights> {
    await delay();
    const c = this.campaigns.find((x) => x.id === campaignId);
    if (!c) throw new Error(`campaign ${campaignId} not found`);
    const clicks = Math.round(c.reach * 0.04);
    return {
      campaignId,
      spend: c.spend,
      impressions: Math.round(c.reach * 1.6),
      reach: c.reach,
      clicks,
      results: c.results,
      costPerResult: c.results > 0 ? +(c.spend / c.results).toFixed(2) : 0,
      period: { start: "2026-05-01", end: "2026-05-31" },
    };
  }

  private setStatus(
    campaignId: string,
    status: MetaCampaign["status"],
  ): MetaCampaign {
    const c = this.campaigns.find((x) => x.id === campaignId);
    if (!c) throw new Error(`campaign ${campaignId} not found`);
    c.status = status;
    return { ...c };
  }
}
