"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type OnboardingState = { error?: string };

const str = (fd: FormData, k: string) => {
  const v = String(fd.get(k) ?? "").trim();
  return v || null;
};

/** Saves the business profile ("ג׳וני רוצה להכיר את העסק שלך") and marks onboarding done. */
export async function saveBusinessProfile(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  const businessName = str(formData, "business_name");
  if (!businessName) return { error: "נא למלא את שם העסק" };

  const user = await requireUser();
  const supabase = createClient();

  // Optional logo upload.
  let logoPath: string | null = null;
  const logo = formData.get("logo");
  if (logo instanceof File && logo.size > 0) {
    if (logo.size > 5 * 1024 * 1024) return { error: "הלוגו גדול מדי (עד 5MB)" };
    const safe = logo.name.replace(/[^\w.\-]+/g, "_");
    const path = `${user.id}/brand/${crypto.randomUUID()}-${safe}`;
    const { error } = await supabase.storage
      .from("assets")
      .upload(path, logo, { contentType: logo.type });
    if (!error) logoPath = path;
  }

  const payload = {
    user_id: user.id,
    business_name: businessName,
    industry: str(formData, "industry"),
    description: str(formData, "description"),
    products_services: str(formData, "products_services"),
    target_audience: str(formData, "target_audience"),
    brand_voice: str(formData, "brand_voice"),
    brand_colors: str(formData, "brand_colors"),
    website: str(formData, "website"),
    instagram_handle: str(formData, "instagram_handle"),
    completed: true,
    ...(logoPath ? { logo_path: logoPath } : {}),
  };

  const { error } = await supabase
    .from("business_profiles")
    .upsert(payload, { onConflict: "user_id" });
  if (error) return { error: "שמירה נכשלה, נסו שוב" };

  revalidatePath("/", "layout");
  redirect("/dashboard?welcome=1");
}
