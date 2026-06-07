import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  ChatWindow,
  type ChatMessageView,
} from "@/components/chat/chat-window";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { new?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();
  const kickoff = searchParams.new === "campaign" ? "campaign" : undefined;

  // Load the most recent session and its messages.
  const { data: session } = await supabase
    .from("chat_sessions")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let messages: ChatMessageView[] = [];
  if (session) {
    const { data } = await supabase
      .from("chat_messages")
      .select("id, role, content")
      .eq("session_id", session.id)
      .order("created_at", { ascending: true });

    messages = (data ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        content: m.content,
      }));
  }

  return (
    <ChatWindow
      initialSessionId={session?.id ?? null}
      initialMessages={kickoff ? [] : messages}
      kickoff={kickoff}
    />
  );
}
