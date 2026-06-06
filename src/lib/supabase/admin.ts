import "server-only";
import { createClient } from "@supabase/supabase-js";
import { clientEnv, serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. BYPASSES Row Level Security.
 *
 * Use ONLY in trusted server contexts that must act across tenants:
 * Stripe/Meta webhooks, cron jobs (budget guard), and Super Admin actions.
 * Never import this into a client component or expose its key to the browser.
 */
export function createAdminClient() {
  const { SUPABASE_SERVICE_ROLE_KEY } = serverEnv();
  if (!SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  }

  return createClient<Database>(
    clientEnv.NEXT_PUBLIC_SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
