import type {
  AIChatResult,
  AssetAnalysis,
  ChatMessageInput,
  FeedbackAnalysis,
  GeneratedCopy,
  RejectionExplanation,
} from "./types";

/**
 * Abstraction over the Gemini engine. The mock parses Hebrew intent with simple
 * heuristics; the live implementation (Milestone 4) calls Gemini text + image
 * models while satisfying the same contract.
 */
export interface AIProvider {
  readonly models: { text: string; image: string };

  /** Parse a Hebrew conversation turn into intent + a comforting reply. */
  chat(messages: ChatMessageInput[]): Promise<AIChatResult>;

  /** Extract visual attributes and improvement ideas from an uploaded asset. */
  analyzeAsset(input: {
    filename: string;
    mimeType: string;
  }): Promise<AssetAnalysis>;

  /** Draft high-converting Hebrew ad copy. */
  generateCopy(input: { product: string; tone?: string }): Promise<GeneratedCopy>;

  /** Translate a raw Meta rejection reason into plain Hebrew + safe copy (Pillar 3). */
  explainRejection(reason: string): Promise<RejectionExplanation>;

  /** Analyze the merchant's lead-quality feedback into targeting adjustments (Pillar 5). */
  analyzeFeedback(text: string): Promise<FeedbackAnalysis>;
}
