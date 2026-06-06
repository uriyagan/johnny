import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const IMPERSONATION_COOKIE = "impersonate_uid";

export interface EffectiveUser {
  id: string;
  email: string;
  /** True when an admin is currently viewing the app as this user. */
  isImpersonating: boolean;
}

/** Raw Supabase auth user (the real signed-in identity), or null. */
export async function getUser() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

async function isRealAdmin(userId: string): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();
  return data?.role === "admin";
}

/**
 * The user the app should act as. Normally the signed-in user, but when an
 * admin has an active impersonation cookie it resolves to the target user.
 * Works against RLS because admin policies grant cross-tenant access.
 */
export async function getEffectiveUser(): Promise<EffectiveUser | null> {
  const user = await getUser();
  if (!user) return null;

  const impersonatedId = cookies().get(IMPERSONATION_COOKIE)?.value;
  if (impersonatedId && impersonatedId !== user.id) {
    if (await isRealAdmin(user.id)) {
      const admin = createAdminClient();
      const { data } = await admin.auth.admin.getUserById(impersonatedId);
      return {
        id: impersonatedId,
        email: data.user?.email ?? "",
        isImpersonating: true,
      };
    }
  }

  return { id: user.id, email: user.email ?? "", isImpersonating: false };
}

/** Effective user, or redirect to /login. Used by all client-app pages. */
export async function requireUser(): Promise<EffectiveUser> {
  const user = await getEffectiveUser();
  if (!user) redirect("/login");
  return user;
}

/** Requires the REAL user to be an admin (ignores impersonation). */
export async function requireAdmin() {
  const user = await getUser();
  if (!user) redirect("/login");
  if (!(await isRealAdmin(user.id))) redirect("/dashboard");
  return user;
}
