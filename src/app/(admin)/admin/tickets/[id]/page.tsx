import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { adminReply, setTicketStatus } from "@/lib/actions/tickets";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TicketThread,
  TICKET_STATUS,
} from "@/components/tickets/ticket-thread";

export default async function AdminTicketPage({
  params,
}: {
  params: { id: string };
}) {
  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("tickets")
    .select("id, subject, status, user_id")
    .eq("id", params.id)
    .maybeSingle();
  if (!ticket) notFound();

  const [{ data: messages }, { data: profile }] = await Promise.all([
    admin
      .from("ticket_messages")
      .select("id, from_admin, body, created_at")
      .eq("ticket_id", ticket.id)
      .order("created_at", { ascending: true }),
    admin
      .from("profiles")
      .select("full_name, business_name")
      .eq("id", ticket.user_id)
      .maybeSingle(),
  ]);

  const clientName =
    profile?.business_name || profile?.full_name || "לקוח";

  return (
    <div>
      <Link href="/admin/tickets" className="text-sm text-muted-2 hover:underline">
        ← חזרה לטיקטים
      </Link>
      <div className="mt-3 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{ticket.subject}</h1>
          <p className="text-sm text-muted-2">{clientName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone={TICKET_STATUS[ticket.status].tone}>
            {TICKET_STATUS[ticket.status].label}
          </Badge>
          <form action={setTicketStatus}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <input
              type="hidden"
              name="status"
              value={ticket.status === "closed" ? "open" : "closed"}
            />
            <Button type="submit" variant="secondary" size="sm">
              {ticket.status === "closed" ? "פתיחה מחדש" : "סגירת טיקט"}
            </Button>
          </form>
        </div>
      </div>

      <div className="mt-6 max-w-2xl">
        <TicketThread messages={messages ?? []} />

        <form action={adminReply} className="mt-5">
          <input type="hidden" name="ticket_id" value={ticket.id} />
          <textarea
            name="body"
            rows={3}
            required
            placeholder="כתבו תשובה ללקוח…"
            className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-2">
            <Button type="submit" size="sm">
              שליחת תשובה
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
