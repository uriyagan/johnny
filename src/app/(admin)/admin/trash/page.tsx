import { createAdminClient } from "@/lib/supabase/admin";
import { restoreAdAccount, restoreAsset } from "@/lib/actions/trash";
import { Button } from "@/components/ui/button";

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminTrashPage() {
  const admin = createAdminClient();
  const [{ data: accounts }, { data: assets }] = await Promise.all([
    admin
      .from("ad_accounts")
      .select("id, name, external_account_id, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
    admin
      .from("assets")
      .select("id, original_filename, kind, deleted_at")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false }),
  ]);

  const accs = accounts ?? [];
  const ass = assets ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">סל מיחזור</h1>
      <p className="mt-1 text-muted">
        פריטים שנמחקו ניתנים לשחזור. שום דבר לא נמחק לצמיתות.
      </p>

      <h2 className="mt-6 text-lg font-semibold text-foreground">
        חשבונות מודעות ({accs.length})
      </h2>
      <div className="mt-3 space-y-2">
        {accs.length === 0 && <p className="text-sm text-muted-2">אין פריטים.</p>}
        {accs.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
          >
            <div>
              <p className="font-medium text-foreground">{a.name ?? "חשבון"}</p>
              <p className="text-xs text-muted-2">
                נמחק {a.deleted_at ? dateFmt.format(new Date(a.deleted_at)) : ""}
              </p>
            </div>
            <form action={restoreAdAccount}>
              <input type="hidden" name="id" value={a.id} />
              <Button type="submit" variant="secondary" size="sm">
                שחזור
              </Button>
            </form>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-foreground">
        מדיה ({ass.length})
      </h2>
      <div className="mt-3 space-y-2">
        {ass.length === 0 && <p className="text-sm text-muted-2">אין פריטים.</p>}
        {ass.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
          >
            <div>
              <p className="font-medium text-foreground">
                {a.original_filename ?? a.kind}
              </p>
              <p className="text-xs text-muted-2">
                נמחק {a.deleted_at ? dateFmt.format(new Date(a.deleted_at)) : ""}
              </p>
            </div>
            <form action={restoreAsset}>
              <input type="hidden" name="id" value={a.id} />
              <Button type="submit" variant="secondary" size="sm">
                שחזור
              </Button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
