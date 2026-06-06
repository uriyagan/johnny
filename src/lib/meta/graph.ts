import "server-only";

export const META_GRAPH_VERSION = "v21.0";
export const META_GRAPH = `https://graph.facebook.com/${META_GRAPH_VERSION}`;

/**
 * OAuth scopes for the Meta connect flow. Kept to the ads essentials — page /
 * business-management scopes require App Review and aren't needed to read &
 * manage ad accounts during testing.
 */
export const META_SCOPES = ["ads_read", "ads_management"].join(",");

type Params = Record<string, string | number | undefined>;

function qs(params: Params): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) sp.set(k, String(v));
  }
  return sp.toString();
}

/** GET a Graph API endpoint and return parsed JSON (throws on API error). */
export async function graphGet<T>(
  path: string,
  accessToken: string,
  params: Params = {},
): Promise<T> {
  const url = `${META_GRAPH}/${path}?${qs({ ...params, access_token: accessToken })}`;
  const res = await fetch(url, { cache: "no-store" });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? `Graph error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}

/** POST to a Graph API endpoint (used for mutations like status changes). */
export async function graphPost<T>(
  path: string,
  accessToken: string,
  body: Params,
): Promise<T> {
  const res = await fetch(`${META_GRAPH}/${path}`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: qs({ ...body, access_token: accessToken }),
    cache: "no-store",
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message ?? `Graph error ${res.status}`;
    throw new Error(msg);
  }
  return data as T;
}
