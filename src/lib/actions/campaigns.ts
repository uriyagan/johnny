"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { getAdsProvider } from "@/lib/ads";

/** Pauses a campaign via the Ads provider. */
export async function pauseCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await requireUser();
  await getAdsProvider().pauseCampaign(id);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}

/** Resumes a campaign via the Ads provider. */
export async function resumeCampaign(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await requireUser();
  await getAdsProvider().resumeCampaign(id);
  revalidatePath("/campaigns");
  revalidatePath("/dashboard");
}
