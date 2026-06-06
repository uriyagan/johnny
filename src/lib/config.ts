import { clientEnv } from "@/lib/env";

/**
 * Mock toggles. NEXT_PUBLIC_USE_MOCKS is the global default; each provider can
 * be overridden independently (e.g. live AI while Meta/Stripe stay mocked).
 */
const override = (v?: "true" | "false"): boolean | undefined =>
  v === undefined ? undefined : v === "true";

export const USE_MOCKS = clientEnv.NEXT_PUBLIC_USE_MOCKS;

export const USE_MOCKS_AI =
  override(clientEnv.NEXT_PUBLIC_USE_MOCKS_AI) ?? USE_MOCKS;
export const USE_MOCKS_ADS =
  override(clientEnv.NEXT_PUBLIC_USE_MOCKS_ADS) ?? USE_MOCKS;
export const USE_MOCKS_BILLING =
  override(clientEnv.NEXT_PUBLIC_USE_MOCKS_BILLING) ?? USE_MOCKS;
