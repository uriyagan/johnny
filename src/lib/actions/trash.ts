"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Restores a soft-deleted ad account. */
export async function restoreAdAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("ad_accounts")
    .update({ deleted_at: null, status: "connected" })
    .eq("id", id);
  revalidatePath("/admin/trash");
}

/** Restores a soft-deleted asset. */
export async function restoreAsset(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;
  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("assets").update({ deleted_at: null }).eq("id", id);
  revalidatePath("/admin/trash");
}
