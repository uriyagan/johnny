import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { createAdminClient } from "@/lib/supabase/admin";
import { getTierLimitInfo } from "@/lib/accounts";
import { saveMetaToken } from "@/lib/meta/connection";
import { META_GRAPH } from "@/lib/meta/graph";
import { LiveAdsProvider } from "@/lib/ads/live";

const STATE_COOKIE = "meta_oauth_state";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) return NextResponse.redirect(`${origin}/accounts?meta=denied`);

  const expectedState = cookies().get(STATE_COOKIE)?.value;
  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(`${origin}/accounts?meta=state`);
  }
  cookies().delete(STATE_COOKIE);

  const user = await requireUser();
  const { META_APP_ID, META_APP_SECRET } = serverEnv();
  if (!META_APP_ID || !META_APP_SECRET) {
    return NextResponse.redirect(`${origin}/accounts?meta=config`);
  }

  try {
    // 1) code → short-lived token
    const redirectUri = `${origin}/api/meta/callback`;
    const shortRes = await fetch(
      `${META_GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          redirect_uri: redirectUri,
          code,
        }).toString(),
      { cache: "no-store" },
    );
    const shortData = await shortRes.json();
    if (!shortRes.ok) throw new Error(shortData?.error?.message ?? "token exchange failed");

    // 2) short → long-lived token
    const longRes = await fetch(
      `${META_GRAPH}/oauth/access_token?` +
        new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: META_APP_ID,
          client_secret: META_APP_SECRET,
          fb_exchange_token: shortData.access_token,
        }).toString(),
      { cache: "no-store" },
    );
    const longData = await longRes.json();
    if (!longRes.ok) throw new Error(longData?.error?.message ?? "long token exchange failed");

    const token: string = longData.access_token;
    const expiresAt = longData.expires_in
      ? new Date(Date.now() + Number(longData.expires_in) * 1000).toISOString()
      : null;

    // 3) identify the Meta user
    const meRes = await fetch(
      `${META_GRAPH}/me?` +
        new URLSearchParams({ fields: "id", access_token: token }).toString(),
      { cache: "no-store" },
    );
    const me = await meRes.json();

    await saveMetaToken({
      userId: user.id,
      token,
      expiresAt,
      scopes: "ads_read,ads_management,business_management,pages",
      metaUserId: me?.id ?? null,
    });

    // 4) import ad accounts (respecting the tier limit)
    const provider = new LiveAdsProvider(token);
    const accounts = await provider.listAccounts();

    const admin = createAdminClient();
    const { limit } = await getTierLimitInfo(admin, user.id);
    const { count: existing } = await admin
      .from("ad_accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    const remaining = limit === null ? accounts.length : Math.max(0, limit - (existing ?? 0));
    for (const acc of accounts.slice(0, remaining)) {
      await admin.from("ad_accounts").upsert(
        {
          user_id: user.id,
          provider: "meta",
          external_account_id: acc.id,
          name: acc.name,
          status: "connected",
          connected_at: new Date().toISOString(),
        },
        { onConflict: "provider,external_account_id" },
      );
    }

    return NextResponse.redirect(`${origin}/accounts?meta=connected`);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return NextResponse.redirect(
      `${origin}/accounts?meta=error&reason=${encodeURIComponent(msg)}`,
    );
  }
}
