import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { planByTier, type Tier } from "@/lib/billing/plans";

export interface TierLimitInfo {
  tier: Tier;
  /** Max connected ad accounts. null = unlimited. */
  limit: number | null;
  used: number;
  canAdd: boolean;
}

/**
 * Resolves how many ad accounts the user may connect, based on their
 * subscription tier (defaults to tier_1 when no subscription exists yet).
 */
export async function getTierLimitInfo(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<TierLimitInfo> {
  const [{ data: sub }, { count }] = await Promise.all([
    supabase.from("subscriptions").select("tier").eq("user_id", userId).maybeSingle(),
    supabase
      .from("ad_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
  ]);

  const tier = (sub?.tier ?? "tier_1") as Tier;
  const limit = planByTier(tier).maxAccounts;
  const used = count ?? 0;
  const canAdd = limit === null || used < limit;

  return { tier, limit, used, canAdd };
}
