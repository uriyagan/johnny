import type { MetaAdAccount, MetaCampaign, MetaInsights } from "./types";

/**
 * Abstraction over the Meta Ads API. The mock implementation backs the UI
 * during development; a live implementation (Milestone 5) will satisfy the
 * same contract so swapping is a single factory branch.
 */
export interface AdsProvider {
  readonly name: "meta";

  listAccounts(): Promise<MetaAdAccount[]>;
  getAccount(accountId: string): Promise<MetaAdAccount | null>;

  listCampaigns(accountId: string): Promise<MetaCampaign[]>;
  getCampaign(campaignId: string): Promise<MetaCampaign | null>;

  pauseCampaign(campaignId: string): Promise<MetaCampaign>;
  resumeCampaign(campaignId: string): Promise<MetaCampaign>;

  getInsights(campaignId: string): Promise<MetaInsights>;
}
