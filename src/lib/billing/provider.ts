import type { Tier } from "./plans";
import type { Invoice, PaymentMethod, Subscription } from "./types";

/**
 * Abstraction over Stripe Billing. The PRD requires a fully embedded flow
 * (no hosted Checkout / Portal), so the interface exposes the primitives the
 * in-app Stripe Elements UI needs. Live implementation lands in Milestone 6.
 */
export interface BillingProvider {
  readonly name: "stripe";

  getSubscription(): Promise<Subscription | null>;
  changePlan(tier: Tier): Promise<Subscription>;
  cancelSubscription(): Promise<Subscription>;
  resumeSubscription(): Promise<Subscription>;

  listInvoices(): Promise<Invoice[]>;
  getPaymentMethod(): Promise<PaymentMethod | null>;

  /** Client secret for confirming a card via embedded Stripe Elements. */
  createSetupIntent(): Promise<{ clientSecret: string }>;
}
