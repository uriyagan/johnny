import { createHash } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { serverEnv } from "@/lib/env";

/**
 * Meta webhook endpoint (Pillar 3). GET handles the subscription verification
 * handshake; POST records incoming events idempotently into webhook_events.
 * Per-event policy translation + client notification is wired with the live
 * Meta payload at go-live (Milestone 9).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const { META_VERIFY_TOKEN } = serverEnv();
  if (mode === "subscribe" && token && token === META_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  return NextResponse.json({ error: "verification failed" }, { status: 403 });
}

export async function POST(request: NextRequest) {
  const raw = await request.text();

  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  // Idempotency key derived from the raw body (Meta lacks a stable event id).
  const eventId = createHash("sha256").update(raw).digest("hex");

  const admin = createAdminClient();
  await admin.from("webhook_events").insert({
    source: "meta",
    event_type: "ads_review",
    external_event_id: eventId,
    payload: payload as never,
    status: "pending",
  });
  // Duplicate deliveries hit the unique (source, external_event_id) constraint
  // and are safely ignored.

  return NextResponse.json({ received: true });
}
