import { z } from "zod";

/**
 * Centralised, validated environment access.
 * Public vars (NEXT_PUBLIC_*) are safe in the browser; everything else is
 * server-only and must never be imported into a client component.
 */

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_USE_MOCKS: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  // Optional per-provider overrides (fall back to NEXT_PUBLIC_USE_MOCKS).
  NEXT_PUBLIC_USE_MOCKS_AI: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_USE_MOCKS_ADS: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_USE_MOCKS_BILLING: z.enum(["true", "false"]).optional(),
});

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  GEMINI_TEXT_MODEL: z.string().default("gemini-2.5-pro"),
  GEMINI_IMAGE_MODEL: z.string().default("gemini-2.5-flash-image"),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  META_APP_ID: z.string().optional(),
  META_APP_SECRET: z.string().optional(),
  /** Token echoed back during Meta webhook subscription verification. */
  META_VERIFY_TOKEN: z.string().optional(),
  /** 32-byte hex key for encrypting stored Meta access tokens. */
  META_TOKEN_ENC_KEY: z.string().optional(),
  /** Shared secret the Cloudflare Worker sends to authorize cron endpoints. */
  CRON_SECRET: z.string().optional(),
});

// NEXT_PUBLIC_* must be referenced statically so Next can inline them.
export const clientEnv = clientSchema.parse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_USE_MOCKS: process.env.NEXT_PUBLIC_USE_MOCKS,
  NEXT_PUBLIC_USE_MOCKS_AI: process.env.NEXT_PUBLIC_USE_MOCKS_AI || undefined,
  NEXT_PUBLIC_USE_MOCKS_ADS: process.env.NEXT_PUBLIC_USE_MOCKS_ADS || undefined,
  NEXT_PUBLIC_USE_MOCKS_BILLING:
    process.env.NEXT_PUBLIC_USE_MOCKS_BILLING || undefined,
});

let _serverEnv: z.infer<typeof serverSchema> | null = null;

/** Lazily validate server-only env. Call from server code only. */
export function serverEnv() {
  if (_serverEnv) return _serverEnv;
  _serverEnv = serverSchema.parse(process.env);
  return _serverEnv;
}
