"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin, IMPERSONATION_COOKIE } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type KillType = Database["public"]["Enums"]["killswitch_type"];

async function audit(
  adminId: string,
  action: string,
  targetUserId: string | null,
  details: Record<string, unknown> = {},
) {
  const admin = createAdminClient();
  await admin.from("admin_audit_log").insert({
    admin_id: adminId,
    action,
    target_user_id: targetUserId,
    details: details as never,
  });
}

/** Toggles a global kill switch (api_execution / spending). */
export async function toggleKillSwitch(formData: FormData) {
  const type = String(formData.get("type") ?? "") as KillType;
  const enabled = formData.get("enabled") === "true";
  if (type !== "api_execution" && type !== "spending") return;

  const adminUser = await requireAdmin();
  const admin = createAdminClient();

  const { data: existing } = await admin
    .from("kill_switches")
    .select("id")
    .eq("scope", "global")
    .eq("type", type)
    .is("target_user_id", null)
    .maybeSingle();

  if (existing) {
    await admin
      .from("kill_switches")
      .update({ enabled, set_by: adminUser.id })
      .eq("id", existing.id);
  } else {
    await admin.from("kill_switches").insert({
      scope: "global",
      type,
      target_user_id: null,
      enabled,
      set_by: adminUser.id,
    });
  }

  await audit(adminUser.id, "toggle_killswitch", null, { type, enabled });
  revalidatePath("/admin/kill-switches");
}

/** Begin impersonating a tenant (admin only). */
export async function startImpersonation(formData: FormData) {
  const targetId = String(formData.get("target_id") ?? "").trim();
  if (!targetId) return;

  const adminUser = await requireAdmin();
  cookies().set(IMPERSONATION_COOKIE, targetId, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  await audit(adminUser.id, "impersonate_start", targetId);
  redirect("/dashboard");
}

/** Stop impersonating and return to the admin panel. */
export async function stopImpersonation() {
  const adminUser = await requireAdmin();
  cookies().delete(IMPERSONATION_COOKIE);
  await audit(adminUser.id, "impersonate_stop", null);
  redirect("/admin/tenants");
}
