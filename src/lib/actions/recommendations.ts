"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/** Hides a recommendation card for the current user. */
export async function dismissRecommendation(formData: FormData) {
  const key = String(formData.get("rec_key") ?? "").trim();
  if (!key) return;
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("recommendation_dismissals")
    .upsert(
      { user_id: user.id, rec_key: key },
      { onConflict: "user_id,rec_key" },
    );
  revalidatePath("/dashboard");
}

/** Un-hides a previously dismissed recommendation. */
export async function restoreRecommendation(formData: FormData) {
  const key = String(formData.get("rec_key") ?? "").trim();
  if (!key) return;
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("recommendation_dismissals")
    .delete()
    .eq("user_id", user.id)
    .eq("rec_key", key);
  revalidatePath("/dashboard");
}
