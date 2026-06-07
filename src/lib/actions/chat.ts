"use server";

import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import type { ChatMessageInput } from "@/lib/ai/types";
import type { Json } from "@/types/database";

export type SendResult =
  | { ok: true; sessionId: string; assistant: { id: string; content: string } }
  | { ok: false; error: string };

/**
 * Persists a user turn, runs it through the AI provider for intent + reply,
 * persists the assistant turn, and returns the assistant message.
 * Creates a chat session on the first message.
 */
export async function sendChatMessage(input: {
  sessionId: string | null;
  content: string;
}): Promise<SendResult> {
  const content = input.content.trim();
  if (!content) return { ok: false, error: "ההודעה ריקה" };

  const user = await requireUser();
  const supabase = createClient();

  let sessionId = input.sessionId;
  if (!sessionId) {
    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({ user_id: user.id, title: content.slice(0, 40) })
      .select("id")
      .single();
    if (error || !session) return { ok: false, error: "שגיאה ביצירת שיחה" };
    sessionId = session.id;
  }

  const { error: userErr } = await supabase
    .from("chat_messages")
    .insert({ session_id: sessionId, role: "user", content });
  if (userErr) return { ok: false, error: "שגיאה בשמירת ההודעה" };

  // Recent context for the model: the LATEST 20 messages, in chronological order.
  const { data: recent } = await supabase
    .from("chat_messages")
    .select("role, content, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: false })
    .limit(20);
  const history = (recent ?? [])
    .reverse()
    .map(({ role, content }) => ({ role, content }));

  const ai = getAIProvider();
  const result = await ai.chat(history as ChatMessageInput[]);

  const { data: assistantRow, error: assistantErr } = await supabase
    .from("chat_messages")
    .insert({
      session_id: sessionId,
      role: "assistant",
      content: result.reply,
      intent: result.intent as unknown as Json,
      model: ai.models.text,
    })
    .select("id, content")
    .single();

  if (assistantErr || !assistantRow) {
    return { ok: false, error: "שגיאה בתשובת המערכת" };
  }

  // Bump the session's updated_at so it sorts as most-recent.
  await supabase
    .from("chat_sessions")
    .update({ title: content.slice(0, 40) })
    .eq("id", sessionId);

  return {
    ok: true,
    sessionId,
    assistant: { id: assistantRow.id, content: assistantRow.content },
  };
}
