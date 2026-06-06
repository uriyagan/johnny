import type {
  AIChatResult,
  AssetAnalysis,
  ChatMessageInput,
  GeneratedCopy,
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
}
