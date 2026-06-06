import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { toggleAutomation } from "@/lib/actions/emails";
import { EMAIL_TRIGGERS } from "@/lib/email/registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function AdminEmailsPage() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("email_automations")
    .select("trigger_key, enabled, subject");

  const byKey = new Map(
    (rows ?? []).map((r) => [r.trigger_key, r]),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">אוטומציות מייל</h1>
      <p className="mt-1 text-muted">
        מיילים אוטומטיים שנשלחים ללקוחות באירועים שונים.
      </p>

      <div className="mt-6 space-y-3">
        {EMAIL_TRIGGERS.map((t) => {
          const row = byKey.get(t.key);
          const enabled = row?.enabled ?? true;
          const subject = row?.subject ?? t.defaultSubject;
          return (
            <div
              key={t.key}
              className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/admin/emails/${t.key}`}
                    className="font-medium text-foreground hover:underline"
                  >
                    {t.name}
                  </Link>
                  <Badge tone={enabled ? "green" : "gray"}>
                    {enabled ? "פעיל" : "כבוי"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-2">{subject}</p>
              </div>
              <div className="flex items-center gap-2">
                <form action={toggleAutomation}>
                  <input type="hidden" name="trigger_key" value={t.key} />
                  <input
                    type="hidden"
                    name="enabled"
                    value={enabled ? "false" : "true"}
                  />
                  <Button type="submit" variant="ghost" size="sm">
                    {enabled ? "כיבוי" : "הפעלה"}
                  </Button>
                </form>
                <Link
                  href={`/admin/emails/${t.key}`}
                  className="inline-flex h-9 items-center rounded-lg bg-surface-2 px-3 text-sm font-medium text-foreground hover:bg-white/10"
                >
                  עריכה
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
