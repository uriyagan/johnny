import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { encryptToken, decryptToken } from "@/lib/crypto-token";

/** Stores (encrypted) the user's long-lived Meta token. */
export async function saveMetaToken(input: {
  userId: string;
  token: string;
  expiresAt: string | null;
  scopes: string;
  metaUserId: string | null;
}): Promise<void> {
  const admin = createAdminClient();
  await admin.from("meta_connections").upsert(
    {
      user_id: input.userId,
      access_token_enc: encryptToken(input.token),
      token_expires_at: input.expiresAt,
      scopes: input.scopes,
      meta_user_id: input.metaUserId,
    },
    { onConflict: "user_id" },
  );
}

/** Returns the decrypted Meta token for a user, or null if not connected. */
export async function getMetaToken(userId: string): Promise<string | null> {
  const admin = createAdminClient();
  const { data } = await admin
    .from("meta_connections")
    .select("access_token_enc")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) return null;
  try {
    return decryptToken(data.access_token_enc);
  } catch {
    return null;
  }
}

export async function hasMetaConnection(userId: string): Promise<boolean> {
  return (await getMetaToken(userId)) !== null;
}
