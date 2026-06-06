"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTrigger } from "@/lib/email/registry";

/** Save subject/body for a trigger (admin). */
export async function saveAutomation(formData: FormData) {
  const triggerKey = String(formData.get("trigger_key") ?? "");
  const subject = String(formData.get("subject") ?? "").trim();
  const bodyHtml = String(formData.get("body_html") ?? "").trim();
  if (!getTrigger(triggerKey) || !subject || !bodyHtml) {
    redirect(`/admin/emails/${triggerKey}?error=1`);
  }

  await requireAdmin();
  const admin = createAdminClient();
  await admin
    .from("email_automations")
    .upsert(
      { trigger_key: triggerKey, subject, body_html: bodyHtml },
      { onConflict: "trigger_key" },
    );

  redirect(`/admin/emails/${triggerKey}?saved=1`);
}

/** Enable/disable a trigger (admin). */
export async function toggleAutomation(formData: FormData) {
  const triggerKey = String(formData.get("trigger_key") ?? "");
  const enabled = formData.get("enabled") === "true";
  const trigger = getTrigger(triggerKey);
  if (!trigger) return;

  await requireAdmin();
  const admin = createAdminClient();
  await admin.from("email_automations").upsert(
    {
      trigger_key: triggerKey,
      enabled,
      subject: trigger.defaultSubject,
      body_html: trigger.defaultBodyHtml,
    },
    { onConflict: "trigger_key" },
  );
  // Keep existing subject/body if a row already exists.
  await admin
    .from("email_automations")
    .update({ enabled })
    .eq("trigger_key", triggerKey);

  revalidatePath("/admin/emails");
}

/** Send a test email for a trigger (admin). */
export async function sendTestEmail(formData: FormData) {
  const triggerKey = String(formData.get("trigger_key") ?? "");
  const to = String(formData.get("to") ?? "").trim();
  if (!to) redirect(`/admin/emails/${triggerKey}?error=email`);

  await requireAdmin();
  const { sendTest } = await import("@/lib/email/send");
  const res = await sendTest(triggerKey, to);
  redirect(
    `/admin/emails/${triggerKey}?${res.ok ? "tested=1" : `error=${encodeURIComponent(res.error ?? "send")}`}`,
  );
}
