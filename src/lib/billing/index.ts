import { USE_MOCKS } from "@/lib/config";
import type { BillingProvider } from "./provider";
import { MockBillingProvider } from "./mock";

let instance: BillingProvider | null = null;

/** Returns the active billing provider (mock or live Stripe). */
export function getBillingProvider(): BillingProvider {
  if (instance) return instance;

  if (USE_MOCKS) {
    instance = new MockBillingProvider();
    return instance;
  }

  // Live Stripe implementation lands in Milestone 6.
  throw new Error(
    "Live Stripe provider is not available yet. Set NEXT_PUBLIC_USE_MOCKS=true.",
  );
}

export type { BillingProvider } from "./provider";
export type { Tier, Plan } from "./plans";
export { PLANS, planByTier } from "./plans";
export type * from "./types";
