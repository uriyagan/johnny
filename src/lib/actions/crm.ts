"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAIProvider } from "@/lib/ai";
import { CHECKIN_QUESTION } from "@/lib/crm";
import type { Json } from "@/types/database";

/**
 * Opens a lead-quality check-in for the current user (if none is open).
 * Check-ins are system-created, so this uses the service-role client.
 */
export async function startCheckin() {
  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: open } = await supabase
    .from("crm_feedback")
    .select("id")
    .eq("user_id", user.id)
    .is("completed_at", null)
    .maybeSingle();

  if (!open) {
    await supabase.from("crm_feedback").insert({
      user_id: user.id,
      question: CHECKIN_QUESTION,
      scheduled_for: new Date().toISOString(),
    });
  }

  revalidatePath("/dashboard");
}

/** Records the merchant's reply, analyzes it, and applies targeting adjustments. */
export async function submitFeedback(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  const response = String(formData.get("response") ?? "").trim();
  if (!id || !response) return;

  const user = await requireUser();
  const supabase = createAdminClient();

  const { data: fb } = await supabase
    .from("crm_feedback")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!fb) return;

  const analysis = await getAIProvider().analyzeFeedback(response);

  await supabase
    .from("crm_feedback")
    .update({
      response_text: response,
      gemini_analysis: analysis as unknown as Json,
      applied_adjustments: { adjustments: analysis.adjustments } as unknown as Json,
      completed_at: new Date().toISOString(),
    })
    .eq("id", id);

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "crm_checkin",
    channel: "in_app",
    title: "עדכנו את המיקוד לפי המשוב שלך",
    body: analysis.adjustments.join(" · "),
  });

  revalidatePath("/dashboard");
}
