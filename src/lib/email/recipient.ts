import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

/** Resolves a user's email + common merge-tag context for transactional email. */
export async function getRecipient(userId: string): Promise<{
  email: string | null;
  ctx: Record<string, string>;
}> {
  const admin = createAdminClient();
  const [{ data: au }, { data: prof }, { data: biz }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("profiles").select("full_name").eq("id", userId).maybeSingle(),
    admin
      .from("business_profiles")
      .select("business_name")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const first = (prof?.full_name ?? "").split(" ")[0] || "לקוח";
  return {
    email: au.user?.email ?? null,
    ctx: {
      "user.first_name": first,
      "business.name": biz?.business_name ?? "",
      "system.app_name": "Johnny",
    },
  };
}
