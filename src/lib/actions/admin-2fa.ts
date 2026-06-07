"use server";

import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { sendAdmin2FACode, verifyAdmin2FACode } from "@/lib/admin-2fa";

/** (Re)sends a fresh admin login code to the admin's email. */
export async function sendAdminCode() {
  const user = await requireAdmin();
  if (user.email) await sendAdmin2FACode(user.id, user.email);
  redirect("/admin-verify?sent=1");
}

/** Verifies the submitted code; on success grants admin access. */
export async function verifyAdminCode(formData: FormData) {
  const code = String(formData.get("code") ?? "").trim();
  const user = await requireAdmin();
  if (!/^\d{6}$/.test(code)) redirect("/admin-verify?error=format");
  const ok = await verifyAdmin2FACode(user.id, code);
  redirect(ok ? "/admin" : "/admin-verify?error=1");
}
