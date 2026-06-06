"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getAdsProvider } from "@/lib/ads";
import { isGlobalKill } from "@/lib/kill-switch";

/** Pauses a campaign via the Ads provider. */
export async function pauseCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await requireUser();
  if (await isGlobalKill("api_execution")) return; // emergency stop
  await getAdsProvider().pauseCampaign(id);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}

/** Resumes a campaign via the Ads provider. */
export async function resumeCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await requireUser();
  if (await isGlobalKill("api_execution")) return; // emergency stop
  await getAdsProvider().resumeCampaign(id);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}
