import { cn } from "@/lib/utils";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type Status = Database["public"]["Enums"]["ticket_status"];

export const TICKET_STATUS: Record<Status, { label: string; tone: BadgeTone }> = {
  open: { label: "פתוח", tone: "yellow" },
  answered: { label: "נענה", tone: "green" },
  closed: { label: "סגור", tone: "gray" },
};

const timeFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

export type ThreadMessage = {
  id: string;
  from_admin: boolean;
  body: string;
  created_at: string;
};

export function TicketThread({ messages }: { messages: ThreadMessage[] }) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m) => (
        <div
          key={m.id}
          className={cn(
            "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
            m.from_admin
              ? "self-end bg-emerald-600 text-white"
              : "self-start border border-border bg-surface-2 text-foreground",
          )}
        >
          <p className="whitespace-pre-wrap">{m.body}</p>
          <p
            className={cn(
              "mt-1 text-[10px]",
              m.from_admin ? "text-white/70" : "text-muted-2",
            )}
          >
            {m.from_admin ? "ג׳וני · תמיכה" : "אתם"} ·{" "}
            {timeFmt.format(new Date(m.created_at))}
          </p>
        </div>
      ))}
    </div>
  );
}
