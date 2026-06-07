"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { sendChatMessage } from "@/lib/actions/chat";
import { cn } from "@/lib/utils";

export type ChatMessageView = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const EXAMPLES = [
  "הקמפיין שלי לא עובד",
  "כמה כסף הוצאתי החודש?",
  "אפשר לעצור את הקמפיין?",
];

export function ChatWindow({
  initialSessionId,
  initialMessages,
}: {
  initialSessionId: string | null;
  initialMessages: ChatMessageView[];
}) {
  const [sessionId, setSessionId] = useState(initialSessionId);
  const [messages, setMessages] = useState<ChatMessageView[]>(initialMessages);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const tempCounter = useRef(0);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, pending]);

  function send(text: string) {
    const content = text.trim();
    if (!content || pending) return;
    setError(null);
    setInput("");

    const tempId = `tmp-${tempCounter.current++}`;
    setMessages((prev) => [...prev, { id: tempId, role: "user", content }]);

    startTransition(async () => {
      const res = await sendChatMessage({ sessionId, content });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSessionId(res.sessionId);
      setMessages((prev) => [
        ...prev,
        { id: res.assistant.id, role: "assistant", content: res.assistant.content },
      ]);
    });
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-lg font-semibold text-foreground">צ'אט</h1>
        <p className="text-sm text-muted-2">
          דברו איתי במילים שלכם — אני כאן כדי לעזור.
        </p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6">
        {isEmpty ? (
          <div className="mx-auto max-w-md pt-10 text-center">
            <p className="text-2xl">👋</p>
            <p className="mt-2 font-medium text-foreground">איך אפשר לעזור?</p>
            <p className="mt-1 text-sm text-muted-2">
              נסו לכתוב לי משהו, למשל:
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => send(ex)}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-sm text-muted hover:border-emerald-500/40 hover:bg-emerald-500/10"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto flex max-w-2xl flex-col gap-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed",
                  m.role === "user"
                    ? "self-start bg-emerald-600 text-white"
                    : "self-end border border-border bg-surface text-foreground",
                )}
              >
                {m.content}
              </div>
            ))}
            {pending && (
              <div className="flex items-center gap-2 self-end rounded-2xl border border-border bg-surface px-4 py-2.5 text-sm text-muted-2">
                <span className="flex gap-1">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:0ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:150ms]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:300ms]" />
                </span>
                ג׳וני חושב…
              </div>
            )}
            <div ref={endRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-border px-6 py-4"
      >
        {error && <p className="mb-2 text-sm text-red-400">{error}</p>}
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="כתבו הודעה…"
            className="h-11 flex-1 rounded-full border border-border bg-surface px-4 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={pending || !input.trim()}
            className="h-11 shrink-0 rounded-full bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            שליחה
          </button>
        </div>
      </form>
    </div>
  );
}
