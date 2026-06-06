import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database, Json } from "@/types/database";

type Provider = Database["public"]["Enums"]["usage_provider"];

/** Estimated USD rates per token (input/output) + per-image, by model. */
const RATES: Record<string, { in: number; out: number; perImage?: number }> = {
  "gemini-2.5-pro": { in: 1.25 / 1e6, out: 10 / 1e6 },
  "gemini-2.5-flash": { in: 0.3 / 1e6, out: 2.5 / 1e6 },
  "gemini-2.5-flash-image": { in: 0.3 / 1e6, out: 2.5 / 1e6, perImage: 0.039 },
};

export function estimateGeminiCost(
  model: string,
  tokensIn: number,
  tokensOut: number,
  images = 0,
): number {
  const r = RATES[model] ?? { in: 1 / 1e6, out: 5 / 1e6 };
  return tokensIn * r.in + tokensOut * r.out + images * (r.perImage ?? 0);
}

/** Records a usage event. Never throws. */
export async function logUsage(input: {
  provider: Provider;
  operation: string;
  userId?: string | null;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from("api_usage").insert({
      provider: input.provider,
      operation: input.operation,
      user_id: input.userId ?? null,
      tokens_in: input.tokensIn ?? 0,
      tokens_out: input.tokensOut ?? 0,
      cost_usd: input.costUsd ?? 0,
      metadata: (input.metadata ?? {}) as Json,
    });
  } catch {
    // usage logging must never break the request
  }
}
