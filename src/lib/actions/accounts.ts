"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTierLimitInfo } from "@/lib/accounts";

/** Links a Meta ad account (from the OAuth-returned pool) to the current user. */
export async function connectAccount(formData: FormData) {
  const externalId = String(formData.get("external_account_id") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  if (!externalId) redirect("/accounts/connect?error=missing");

  const user = await requireUser();
  const supabase = createClient();

  const { canAdd } = await getTierLimitInfo(supabase, user.id);
  if (!canAdd) redirect("/accounts/connect?error=limit");

  const { error } = await supabase.from("ad_accounts").insert({
    user_id: user.id,
    provider: "meta",
    external_account_id: externalId,
    name: name || null,
    status: "connected",
    connected_at: new Date().toISOString(),
  });

  if (error) {
    // Unique violation → already connected (possibly by another tenant).
    redirect("/accounts/connect?error=exists");
  }

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/accounts");
}

/** Removes a connected ad account. */
export async function disconnectAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/accounts");

  const user = await requireUser();
  const supabase = createClient();

  // Soft delete (recoverable from /admin/trash).
  await supabase
    .from("ad_accounts")
    .update({ deleted_at: new Date().toISOString(), status: "disconnected" })
    .eq("id", id)
    .eq("user_id", user.id);

  revalidatePath("/accounts");
  revalidatePath("/dashboard");
  redirect("/accounts");
}
