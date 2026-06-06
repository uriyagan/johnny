import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { saveAutomation, sendTestEmail } from "@/lib/actions/emails";
import { getTrigger } from "@/lib/email/registry";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { EmailEditor } from "@/components/admin/email/email-editor";

export default async function EditEmailPage({
  params,
  searchParams,
}: {
  params: { key: string };
  searchParams: { saved?: string; tested?: string; error?: string };
}) {
  const trigger = getTrigger(params.key);
  if (!trigger) notFound();

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("email_automations")
    .select("subject, body_html")
    .eq("trigger_key", params.key)
    .maybeSingle();

  const subject = row?.subject ?? trigger.defaultSubject;
  const bodyHtml = row?.body_html ?? trigger.defaultBodyHtml;

  return (
    <div>
      <Link href="/admin/emails" className="text-sm text-muted-2 hover:underline">
        ← חזרה לאוטומציות
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-foreground">{trigger.name}</h1>
      <p className="mt-1 text-muted">{trigger.description}</p>

      {searchParams.saved && (
        <p className="mt-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          נשמר ✓
        </p>
      )}
      {searchParams.tested && (
        <p className="mt-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          מייל בדיקה נשלח ✓
        </p>
      )}
      {searchParams.error && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
          שגיאה: {searchParams.error}
        </p>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <form action={saveAutomation} className="space-y-4 lg:col-span-2">
          <input type="hidden" name="trigger_key" value={trigger.key} />
          <div>
            <Label htmlFor="subject">נושא המייל</Label>
            <Input id="subject" name="subject" defaultValue={subject} required />
          </div>
          <div>
            <Label>תוכן המייל</Label>
            <EmailEditor
              name="body_html"
              defaultValue={bodyHtml}
              mergeTags={trigger.mergeTags.map((t) => t.key)}
            />
          </div>
          <Button type="submit">שמירה</Button>
        </form>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4">
            <p className="text-sm font-medium text-foreground">תגים דינמיים</p>
            <p className="mt-1 text-xs text-muted-2">
              הוסיפו אותם בנושא או בתוכן והם יוחלפו אוטומטית.
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {trigger.mergeTags.map((t) => (
                <code
                  key={t.key}
                  className="rounded bg-surface-2 px-2 py-0.5 text-xs text-emerald-300"
                  dir="ltr"
                >
                  {`{{${t.key}}}`}
                </code>
              ))}
            </div>
          </div>

          <form
            action={sendTestEmail}
            className="rounded-2xl border border-border bg-surface p-4"
          >
            <input type="hidden" name="trigger_key" value={trigger.key} />
            <p className="text-sm font-medium text-foreground">שליחת מייל בדיקה</p>
            <Input
              name="to"
              type="email"
              dir="ltr"
              placeholder="you@example.com"
              className="mt-2"
              required
            />
            <Button type="submit" variant="secondary" size="sm" className="mt-2">
              שליחת בדיקה
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
