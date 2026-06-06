import { USE_MOCKS_BILLING } from "@/lib/config";
import type { BillingProvider } from "./provider";
import { MockBillingProvider } from "./mock";

let instance: BillingProvider | null = null;

/** Returns the active billing provider (mock or live Stripe, per USE_MOCKS_BILLING). */
export function getBillingProvider(): BillingProvider {
  if (instance) return instance;

  if (USE_MOCKS_BILLING) {
    instance = new MockBillingProvider();
    return instance;
  }

  // Live Stripe implementation lands in Milestone 6.
  throw new Error(
    "Live Stripe provider is not available yet. Set NEXT_PUBLIC_USE_MOCKS_BILLING=true.",
  );
}

export type { BillingProvider } from "./provider";
export type { Tier, Plan } from "./plans";
export { PLANS, planByTier } from "./plans";
export type * from "./types";
