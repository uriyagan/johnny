"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAdsProvider } from "@/lib/ads";
import type { MetaPage } from "@/lib/ads/types";
import type { CampaignDraft } from "@/lib/ai/types";

/** Pages the user can publish from. */
export async function listMetaPages(): Promise<MetaPage[]> {
  const user = await requireUser();
  try {
    const ads = await getAdsProvider(user.id);
    return await ads.listPages();
  } catch {
    return [];
  }
}

export type PublishResult =
  | { ok: true; campaignId: string }
  | { ok: false; error: string };

/** Publishes a drafted campaign to Meta (PAUSED) on the user's first ad account. */
export async function publishCampaign(input: {
  draft: CampaignDraft;
  imageUrl: string | null;
  pageId: string;
  linkUrl: string;
}): Promise<PublishResult> {
  const user = await requireUser();

  if (!input.pageId) return { ok: false, error: "בחרו עמוד פייסבוק" };
  const link = (input.linkUrl || "").trim();
  if (!/^https?:\/\//.test(link)) {
    return { ok: false, error: "הזינו כתובת יעד תקינה (https://...)" };
  }

  try {
    const supabase = createClient();
    const { data: acc } = await supabase
      .from("ad_accounts")
      .select("external_account_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (!acc) return { ok: false, error: "אין חשבון מודעות מחובר" };

    const ads = await getAdsProvider(user.id);
    const res = await ads.createCampaign({
      accountId: acc.external_account_id,
      pageId: input.pageId,
      linkUrl: link,
      name: input.draft.name,
      dailyBudgetIls: input.draft.dailyBudgetIls,
      headline: input.draft.headline,
      primaryText: input.draft.primaryText,
      description: input.draft.description,
      callToAction: input.draft.callToAction,
      imageUrl: input.imageUrl,
      audience: {
        countries: input.draft.audience.countries,
        ageMin: input.draft.audience.ageMin,
        ageMax: input.draft.audience.ageMax,
      },
    });
    return { ok: true, campaignId: res.campaignId };
  } catch (e) {
    const { logServerError } = await import("@/lib/log-error");
    await logServerError(e, { route: "/campaigns/new#publish", userId: user.id });
    return {
      ok: false,
      error: e instanceof Error ? e.message : "הפרסום נכשל",
    };
  }
}
