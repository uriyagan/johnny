export type MetaCampaignStatus =
  | "active"
  | "paused"
  | "in_review"
  | "rejected"
  | "archived";

export interface MetaAdAccount {
  /** External Meta account id, e.g. "act_1029384756". */
  id: string;
  name: string;
  currency: string;
  status: "active" | "disabled";
  /** Hard spend cap set on the account, in account currency. null = none. */
  spendCap: number | null;
  /** Amount spent in the current calendar month. */
  amountSpentThisMonth: number;
}

export interface MetaCampaign {
  id: string;
  accountId: string;
  name: string;
  status: MetaCampaignStatus;
  /** Human objective in Hebrew, e.g. "מכירות", "תנועה לאתר". */
  objective: string;
  dailyBudget: number | null;
  lifetimeBudget: number | null;
  spend: number;
  /** Conversions / leads achieved. */
  results: number;
  reach: number;
  /** Set when status is "rejected" (raw Meta reason, English). */
  rejectionReason: string | null;
  createdAt: string;
}

export interface MetaPage {
  id: string;
  name: string;
}

export interface CreateCampaignInput {
  accountId: string; // act_...
  pageId: string;
  linkUrl: string;
  name: string;
  dailyBudgetIls: number;
  headline: string;
  primaryText: string;
  description: string;
  callToAction: string;
  imageUrl: string | null;
  audience: { countries: string[]; ageMin: number; ageMax: number };
}

export interface MetaInsights {
  campaignId: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  results: number;
  costPerResult: number;
  period: { start: string; end: string };
}
