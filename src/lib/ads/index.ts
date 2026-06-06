import { USE_MOCKS_ADS } from "@/lib/config";
import type { AdsProvider } from "./provider";
import { MockAdsProvider } from "./mock";

let mock: AdsProvider | null = null;

/**
 * Returns the active Meta Ads provider.
 * - Mock mode: a shared in-memory instance (userId ignored).
 * - Live mode: a provider bound to the user's stored Meta token; throws
 *   "META_NOT_CONNECTED" if the user hasn't connected an account yet.
 */
export async function getAdsProvider(userId?: string): Promise<AdsProvider> {
  if (USE_MOCKS_ADS) {
    if (!mock) mock = new MockAdsProvider();
    return mock;
  }

  if (!userId) throw new Error("getAdsProvider requires a userId in live mode");

  // Imported lazily so the live (server-only) code never reaches a mock bundle.
  const { getMetaToken } = await import("@/lib/meta/connection");
  const { LiveAdsProvider } = await import("./live");

  const token = await getMetaToken(userId);
  if (!token) throw new Error("META_NOT_CONNECTED");
  return new LiveAdsProvider(token);
}

export type { AdsProvider } from "./provider";
export type * from "./types";
