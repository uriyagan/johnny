import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { clientReply } from "@/lib/actions/tickets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TicketThread,
  TICKET_STATUS,
} from "@/components/tickets/ticket-thread";

export default async function SupportTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: ticket } = await supabase
    .from("tickets")
    .select("id, subject, status, user_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!ticket || ticket.user_id !== user.id) notFound();

  const { data: messages } = await supabase
    .from("ticket_messages")
    .select("id, from_admin, body, created_at")
    .eq("ticket_id", ticket.id)
    .order("created_at", { ascending: true });

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <Link href="/support" className="text-sm text-muted-2 hover:underline">
        ← חזרה לתמיכה
      </Link>
      <div className="mt-3 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
        <Badge tone={TICKET_STATUS[ticket.status].tone}>
          {TICKET_STATUS[ticket.status].label}
        </Badge>
      </div>

      <div className="mt-6 max-w-2xl">
        <TicketThread messages={messages ?? []} />

        <form action={clientReply} className="mt-5">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <textarea
            name="body"
            rows={3}
            required
            placeholder="כתבו תגובה…"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-2">
            <Button type="submit" size="sm">
              שליחה
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
