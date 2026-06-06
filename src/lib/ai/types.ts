export type IntentAction =
  | "run_diagnostic"
  | "get_spend"
  | "adjust_targeting"
  | "change_budget"
  | "pause_campaign"
  | "resume_campaign"
  | "general_help"
  | "unknown";

export interface ParsedIntent {
  action: IntentAction;
  parameters: Record<string, string | number>;
  confidence: number;
}

export interface ChatMessageInput {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface AIChatResult {
  /** Comforting, plain Hebrew reply shown to the user. */
  reply: string;
  intent: ParsedIntent;
}

export interface AssetAnalysis {
  /** Detected visual attributes, in Hebrew. */
  attributes: string[];
  /** Improvement suggestions, in Hebrew. */
  suggestions: string[];
}

export interface GeneratedCopy {
  /** High-converting Hebrew ad-copy variants. */
  variants: string[];
}

export interface RejectionExplanation {
  /** Plain-Hebrew explanation of why the ad was rejected. */
  reasonHe: string;
  /** Safe, policy-compliant Hebrew copy variants to try instead. */
  safeCopy: string[];
}

export interface CampaignDraft {
  /** Internal campaign name. */
  name: string;
  /** Meta objective key, e.g. OUTCOME_TRAFFIC / OUTCOME_SALES / OUTCOME_LEADS. */
  objective: string;
  /** What's being promoted, in Hebrew. */
  productDescription: string;
  audience: {
    countries: string[]; // ISO codes, e.g. ["IL"]
    ageMin: number;
    ageMax: number;
    interests: string; // free-text Hebrew description
  };
  dailyBudgetIls: number;
  headline: string;
  primaryText: string;
  description: string;
  /** Meta CTA enum, e.g. SHOP_NOW / LEARN_MORE / SIGN_UP. */
  callToAction: string;
  /** English prompt for the image generator. */
  imagePrompt: string;
}

export interface CampaignPlanResult {
  /** True when there's enough info to produce a full draft. */
  ready: boolean;
  /** Clarifying questions (Hebrew) to ask when not ready. */
  questions: string[];
  draft?: CampaignDraft;
}

export interface GeneratedImage {
  base64: string;
  mimeType: string;
}

export interface CampaignSummary {
  name: string;
  status: string;
  objective: string;
  spend: number;
  results: number;
  reach: number;
}

export interface CampaignAnalysis {
  /** Plain-Hebrew overview of how the campaigns are doing. */
  summary: string;
  /** What stands out (Hebrew). */
  insights: string[];
  /** Concrete next actions (Hebrew). */
  recommendations: string[];
}

export type LeadQuality = "good" | "mixed" | "poor";

export interface FeedbackAnalysis {
  /** Plain-Hebrew summary of the merchant's feedback. */
  summary: string;
  leadQuality: LeadQuality;
  /** Targeting adjustments to apply, phrased in Hebrew. */
  adjustments: string[];
}
