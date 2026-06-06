import { USE_MOCKS } from "@/lib/config";
import type { AdsProvider } from "./provider";
import { MockAdsProvider } from "./mock";

let instance: AdsProvider | null = null;

/** Returns the active Meta Ads provider (mock or live, per NEXT_PUBLIC_USE_MOCKS). */
export function getAdsProvider(): AdsProvider {
  if (instance) return instance;

  if (USE_MOCKS) {
    instance = new MockAdsProvider();
    return instance;
  }

  // Live implementation lands in Milestone 5.
  throw new Error(
    "Live Meta Ads provider is not available yet. Set NEXT_PUBLIC_USE_MOCKS=true.",
  );
}

export type { AdsProvider } from "./provider";
export type * from "./types";
