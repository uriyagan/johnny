import "server-only";
import { USE_MOCKS } from "@/lib/config";
import type { AIProvider } from "./provider";
import { MockAIProvider } from "./mock";

let instance: AIProvider | null = null;

/**
 * Returns the active AI provider. Server-only because the live implementation
 * uses the GEMINI_API_KEY secret.
 */
export function getAIProvider(): AIProvider {
  if (instance) return instance;

  if (USE_MOCKS) {
    instance = new MockAIProvider();
    return instance;
  }

  // Live Gemini implementation lands in Milestone 4.
  throw new Error(
    "Live Gemini provider is not available yet. Set NEXT_PUBLIC_USE_MOCKS=true.",
  );
}

export type { AIProvider } from "./provider";
export type * from "./types";
export { SYSTEM_PROMPT_HE } from "./prompt";
