"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS, type Tier } from "@/lib/billing/plans";

function isTier(value: string): value is Tier {
  return PLANS.some((p) => p.tier === value);
}

/** Switches the subscription tier (single-click). Persisted as the entitlement source. */
export async function changePlan(formData: FormData) {
  const tier = String(formData.get("tier") ?? "");
  if (!isTier(tier)) return;

  const user = await requireUser();
  const supabase = createClient();

  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await supabase.from("subscriptions").upsert(
    {
      user_id: user.id,
      tier,
      status: "active",
      current_period_end: periodEnd,
      cancel_at_period_end: false,
    },
    { onConflict: "user_id" },
  );

  revalidatePath("/billing");
  revalidatePath("/accounts");
  revalidatePath("/dashboard");
}

/** Flags the subscription to cancel at period end (stays active until then). */
export async function cancelSubscription() {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: true })
    .eq("user_id", user.id);
  revalidatePath("/billing");
}

/** Reverts a pending cancellation. */
export async function resumeSubscription() {
  const user = await requireUser();
  const supabase = createClient();
  await supabase
    .from("subscriptions")
    .update({ cancel_at_period_end: false })
    .eq("user_id", user.id);
  revalidatePath("/billing");
}

export type CardState = { ok?: boolean; error?: string };

/**
 * Mock card save. In production this confirms a Stripe SetupIntent via embedded
 * Stripe Elements; here we validate the shape and simulate success.
 */
export async function savePaymentMethod(
  _prev: CardState,
  formData: FormData,
): Promise<CardState> {
  await requireUser();

  const number = String(formData.get("number") ?? "").replace(/\s+/g, "");
  const exp = String(formData.get("exp") ?? "").trim();
  const cvc = String(formData.get("cvc") ?? "").trim();

  if (!/^\d{12,19}$/.test(number)) return { error: "מספר כרטיס לא תקין" };
  if (!/^\d{2}\/\d{2}$/.test(exp)) return { error: "תוקף לא תקין (MM/YY)" };
  if (!/^\d{3,4}$/.test(cvc)) return { error: "קוד CVC לא תקין" };

  // Simulated network confirmation.
  await new Promise((r) => setTimeout(r, 400));
  return { ok: true };
}
