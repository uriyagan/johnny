import "server-only";
import { USE_MOCKS_AI } from "@/lib/config";
import type { AIProvider } from "./provider";
import { MockAIProvider } from "./mock";
import { LiveAIProvider } from "./live";

let instance: AIProvider | null = null;

/**
 * Returns the active AI provider (mock or live Gemini, per USE_MOCKS_AI).
 * Server-only because the live implementation uses the GEMINI_API_KEY secret.
 */
export function getAIProvider(): AIProvider {
  if (instance) return instance;
  instance = USE_MOCKS_AI ? new MockAIProvider() : new LiveAIProvider();
  return instance;
}

export type { AIProvider } from "./provider";
export type * from "./types";
export { SYSTEM_PROMPT_HE } from "./prompt";
