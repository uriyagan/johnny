import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type KillType = Database["public"]["Enums"]["killswitch_type"];

/** Returns true if a global kill switch of this type is currently enabled. */
export async function isGlobalKill(type: KillType): Promise<boolean> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("kill_switches")
    .select("enabled")
    .eq("scope", "global")
    .eq("type", type)
    .is("target_user_id", null)
    .maybeSingle();
  return data?.enabled ?? false;
}
