import { clientEnv } from "@/lib/env";

/**
 * When true, the app uses the in-memory mock providers in src/lib/{ads,billing,ai}
 * instead of live Meta / Stripe / Gemini APIs. Controlled by NEXT_PUBLIC_USE_MOCKS.
 */
export const USE_MOCKS = clientEnv.NEXT_PUBLIC_USE_MOCKS;
