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
