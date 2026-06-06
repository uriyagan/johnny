import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge } from "@/components/ui/badge";
import { TICKET_STATUS } from "@/components/tickets/ticket-thread";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminTicketsPage() {
  const admin = createAdminClient();

  const [{ data: tickets }, { data: profiles }] = await Promise.all([
    admin
      .from("tickets")
      .select("id, subject, status, user_id, updated_at")
      .order("updated_at", { ascending: false }),
    admin.from("profiles").select("id, full_name, business_name"),
  ]);

  const nameByUser = new Map(
    (profiles ?? []).map((p) => [p.id, p.business_name || p.full_name || "—"]),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">טיקטים</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-background text-muted-2">
            <tr>
              <th className="px-4 py-3 text-start font-medium">נושא</th>
              <th className="px-4 py-3 text-start font-medium">לקוח</th>
              <th className="px-4 py-3 text-start font-medium">סטטוס</th>
              <th className="px-4 py-3 text-start font-medium">עודכן</th>
            </tr>
          </thead>
          <tbody>
            {(tickets ?? []).map((t) => (
              <tr key={t.id} className="border-t border-border hover:bg-surface-2">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/tickets/${t.id}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {t.subject}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">
                  {nameByUser.get(t.user_id) ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={TICKET_STATUS[t.status].tone}>
                    {TICKET_STATUS[t.status].label}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-muted-2">
                  {dateFmt.format(new Date(t.updated_at))}
                </td>
              </tr>
            ))}
            {(tickets ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-muted-2">
                  אין טיקטים עדיין.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
