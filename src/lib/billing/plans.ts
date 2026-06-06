import type { Database } from "@/types/database";

export type Tier = Database["public"]["Enums"]["subscription_tier"];

export interface Plan {
  tier: Tier;
  name: string;
  priceIls: number;
  /** Max connected ad accounts. null = unlimited. */
  maxAccounts: number | null;
  features: string[];
}

/** Pricing & limits from PRD §5. Single source of truth for UI + providers. */
export const PLANS: Plan[] = [
  {
    tier: "tier_1",
    name: "חשבון יחיד",
    priceIls: 499,
    maxAccounts: 1,
    features: ["חשבון מודעות אחד", "ניהול אוטומטי מלא", "התראות תקציב"],
  },
  {
    tier: "tier_2",
    name: "שלושה חשבונות",
    priceIls: 999,
    maxAccounts: 3,
    features: ["עד 3 חשבונות מודעות", "ניהול אוטומטי מלא", "התראות תקציב"],
  },
  {
    tier: "tier_3",
    name: "עשרה חשבונות",
    priceIls: 1399,
    maxAccounts: 10,
    features: ["עד 10 חשבונות מודעות", "ניהול אוטומטי מלא", "עדיפות בתמיכה"],
  },
  {
    tier: "tier_4",
    name: "ללא הגבלה",
    priceIls: 1999,
    maxAccounts: null,
    features: ["חשבונות ללא הגבלה", "ניהול אוטומטי מלא", "תמיכה ייעודית"],
  },
];

export function planByTier(tier: Tier): Plan {
  const plan = PLANS.find((p) => p.tier === tier);
  if (!plan) throw new Error(`unknown tier: ${tier}`);
  return plan;
}
