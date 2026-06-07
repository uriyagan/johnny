"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdsProvider } from "@/lib/ads";
import type { CampaignAnalysis } from "@/lib/ai/types";

export type AnalyzeResult =
  | { ok: true; analysis: CampaignAnalysis }
  | { ok: false; error: string };

/** Gathers the user's campaigns and asks Johnny for an analysis. */
export async function analyzeMyCampaigns(): Promise<AnalyzeResult> {
  const user = await requireUser();
  try {
    const supabase = createClient();
    const { data: accounts } = await supabase
      .from("ad_accounts")
      .select("external_account_id")
      .eq("user_id", user.id)
      .is("deleted_at", null);
    const ids = (accounts ?? []).map((a) => a.external_account_id);

    let summaries: {
      name: string;
      status: string;
      objective: string;
      spend: number;
      results: number;
      reach: number;
    }[] = [];

    if (ids.length > 0) {
      const ads = await getAdsProvider(user.id);
      const lists = await Promise.all(ids.map((id) => ads.listCampaigns(id)));
      summaries = lists.flat().map((c) => ({
        name: c.name,
        status: c.status,
        objective: c.objective,
        spend: c.spend,
        results: c.results,
        reach: c.reach,
      }));
    }

    const { getAIProvider } = await import("@/lib/ai");
    const analysis = await getAIProvider().analyzeCampaigns(summaries);
    return { ok: true, analysis };
  } catch (e) {
    const { logServerError } = await import("@/lib/log-error");
    await logServerError(e, { route: "/campaigns#analyze", userId: user.id });
    return { ok: false, error: "הניתוח נכשל, נסו שוב" };
  }
}
