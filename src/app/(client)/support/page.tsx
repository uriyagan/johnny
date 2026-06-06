import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createTicket } from "@/lib/actions/tickets";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TICKET_STATUS } from "@/components/tickets/ticket-thread";

const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "short" });

export default async function SupportPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: tickets } = await supabase
    .from("tickets")
    .select("id, subject, status, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false });

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-foreground">תמיכה</h1>
      <p className="mt-1 text-muted">צריכים עזרה? פתחו פנייה ונחזור אליכם.</p>

      <section className="mt-6 max-w-2xl rounded-2xl border border-border bg-surface p-5">
        <h2 className="font-semibold text-foreground">פנייה חדשה</h2>
        <form action={createTicket} className="mt-3 space-y-3">
          <div>
            <Label htmlFor="subject">נושא</Label>
            <Input id="subject" name="subject" placeholder="במה נוכל לעזור?" required />
          </div>
          <div>
            <Label htmlFor="body">פירוט</Label>
            <textarea
              id="body"
              name="body"
              rows={4}
              required
              placeholder="כתבו לנו את השאלה או הבעיה…"
              className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <Button type="submit">שליחת פנייה</Button>
        </form>
      </section>

      <h2 className="mt-8 text-lg font-semibold text-foreground">הפניות שלך</h2>
      {tickets && tickets.length > 0 ? (
        <ul className="mt-4 max-w-2xl space-y-2">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link
                href={`/support/${t.id}`}
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4 hover:bg-surface-2"
              >
                <div>
                  <p className="font-medium text-foreground">{t.subject}</p>
                  <p className="text-xs text-muted-2">
                    עודכן {dateFmt.format(new Date(t.updated_at))}
                  </p>
                </div>
                <Badge tone={TICKET_STATUS[t.status].tone}>
                  {TICKET_STATUS[t.status].label}
                </Badge>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-2">אין פניות עדיין.</p>
      )}
    </div>
  );
}
