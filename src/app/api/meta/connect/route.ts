import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { requireUser } from "@/lib/auth";
import { serverEnv } from "@/lib/env";
import { META_GRAPH_VERSION, META_SCOPES } from "@/lib/meta/graph";

const STATE_COOKIE = "meta_oauth_state";

/** Starts the Meta OAuth flow: redirects the user to Facebook's consent dialog. */
export async function GET(request: NextRequest) {
  await requireUser();
  const { META_APP_ID } = serverEnv();
  if (!META_APP_ID) {
    return NextResponse.json({ error: "META_APP_ID not set" }, { status: 500 });
  }

  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/api/meta/callback`;
  const state = randomBytes(16).toString("hex");

  cookies().set(STATE_COOKIE, state, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 600,
  });

  const authUrl =
    `https://www.facebook.com/${META_GRAPH_VERSION}/dialog/oauth?` +
    new URLSearchParams({
      client_id: META_APP_ID,
      redirect_uri: redirectUri,
      state,
      scope: META_SCOPES,
      response_type: "code",
    }).toString();

  return NextResponse.redirect(authUrl);
}
