"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { evaluateBudget } from "@/lib/budget";

function monthBounds() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { start: iso(start), end: iso(end) };
}

/** Creates or updates the user's monthly budget cap (Pillar 1). */
export async function saveBudgetCap(formData: FormData) {
  const cap = Number(formData.get("monthly_cap_ils"));
  const thresholdRaw = Number(formData.get("threshold_pct"));
  const hardPause = formData.get("hard_pause") === "on";

  if (!Number.isFinite(cap) || cap <= 0) {
    redirect("/settings?error=cap");
  }
  const threshold = Number.isFinite(thresholdRaw)
    ? Math.min(100, Math.max(1, Math.round(thresholdRaw)))
    : 90;

  const user = await requireUser();
  const supabase = createClient();
  const { start, end } = monthBounds();

  const { data: existing } = await supabase
    .from("budget_caps")
    .select("id")
    .eq("user_id", user.id)
    .is("ad_account_id", null)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("budget_caps")
      .update({
        monthly_cap_ils: cap,
        threshold_pct: threshold,
        hard_pause_enabled: hardPause,
        period_start: start,
        period_end: end,
        triggered_at: null, // re-arm the guard after an edit
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("budget_caps").insert({
      user_id: user.id,
      ad_account_id: null,
      monthly_cap_ils: cap,
      threshold_pct: threshold,
      hard_pause_enabled: hardPause,
      period_start: start,
      period_end: end,
    });
  }

  revalidatePath("/settings");
  redirect("/settings?saved=1");
}

/** Runs the budget guard immediately for the current user. */
export async function checkBudgetNow() {
  const user = await requireUser();
  const result = await evaluateBudget(user.id);
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  redirect(`/settings?checked=${result.status}`);
}
