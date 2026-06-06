"use server";

import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAIProvider } from "@/lib/ai";
import type { CampaignDraft } from "@/lib/ai/types";

export type BuildResult =
  | { ok: true; ready: false; questions: string[] }
  | { ok: true; ready: true; draft: CampaignDraft; imageUrl: string | null }
  | { ok: false; error: string };

/**
 * Johnny's campaign builder: turns a free-text brief (+ optional answers) into
 * either clarifying questions or a full draft with an AI-generated image.
 * Does NOT publish to Meta — that's the next step.
 */
export async function buildCampaignDraft(input: {
  brief: string;
  answers?: string;
}): Promise<BuildResult> {
  const brief = (input.brief || "").trim();
  if (!brief) return { ok: false, error: "נא לכתוב תיאור קצר" };

  const user = await requireUser();
  try {
    // Pull the brand memory so Johnny generates on-brand.
    const admin = createAdminClient();
    const { data: biz } = await admin
      .from("business_profiles")
      .select(
        "business_name, industry, description, products_services, target_audience, brand_voice, brand_colors, website",
      )
      .eq("user_id", user.id)
      .maybeSingle();

    const brandContext = biz
      ? [
          biz.business_name && `שם העסק: ${biz.business_name}`,
          biz.industry && `תחום: ${biz.industry}`,
          biz.description && `תיאור: ${biz.description}`,
          biz.products_services && `מוצרים/שירותים: ${biz.products_services}`,
          biz.target_audience && `קהל יעד: ${biz.target_audience}`,
          biz.brand_voice && `שפת מותג: ${biz.brand_voice}`,
          biz.brand_colors && `צבעי מותג: ${biz.brand_colors}`,
          biz.website && `אתר: ${biz.website}`,
        ]
          .filter(Boolean)
          .join("\n")
      : undefined;

    const ai = getAIProvider();
    const plan = await ai.planCampaign({
      brief,
      answers: input.answers,
      brandContext,
    });

    if (!plan.ready || !plan.draft) {
      return { ok: true, ready: false, questions: plan.questions };
    }

    // Generate + store the ad image (best-effort).
    let imageUrl: string | null = null;
    try {
      const img = await ai.generateImage(plan.draft.imagePrompt);
      const path = `${user.id}/campaigns/${crypto.randomUUID()}.png`;
      const bytes = Buffer.from(img.base64, "base64");
      const { error } = await admin.storage
        .from("assets")
        .upload(path, bytes, { contentType: img.mimeType });
      if (!error) {
        const { data } = await admin.storage
          .from("assets")
          .createSignedUrl(path, 60 * 60);
        imageUrl = data?.signedUrl ?? null;
      }
    } catch {
      // image is optional — proceed without it
    }

    return { ok: true, ready: true, draft: plan.draft, imageUrl };
  } catch (e) {
    const { logServerError } = await import("@/lib/log-error");
    await logServerError(e, { route: "/campaigns/new", userId: user.id });
    return { ok: false, error: "שגיאה ביצירת הקמפיין, נסו שוב" };
  }
}
