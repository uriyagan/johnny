import type { Database } from "@/types/database";
import type { Tier } from "./plans";

export type SubscriptionStatus =
  Database["public"]["Enums"]["subscription_status"];

export interface Subscription {
  id: string;
  tier: Tier;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Invoice {
  id: string;
  number: string;
  amountIls: number;
  status: "paid" | "open" | "void";
  createdAt: string;
  pdfUrl: string;
}

export interface PaymentMethod {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
}
