import { createAdminClient } from "@/lib/supabase/admin";
import { startImpersonation } from "@/lib/actions/admin";
import { planByTier, type Tier } from "@/lib/billing/plans";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "short" });

export default async function TenantsPage() {
  const admin = createAdminClient();

  const [{ data: profiles }, { data: subs }, { data: accounts }] =
    await Promise.all([
      admin
        .from("profiles")
        .select("id, full_name, business_name, role, created_at")
        .order("created_at", { ascending: false }),
      admin.from("subscriptions").select("user_id, tier"),
      admin.from("ad_accounts").select("user_id"),
    ]);

  const tierByUser = new Map(
    (subs ?? []).map((s) => [s.user_id, s.tier as Tier]),
  );
  const accountsByUser = new Map<string, number>();
  for (const a of accounts ?? []) {
    accountsByUser.set(a.user_id, (accountsByUser.get(a.user_id) ?? 0) + 1);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">לקוחות</h1>

      <div className="mt-6 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-background text-muted-2">
            <tr>
              <th className="px-4 py-3 text-start font-medium">שם / עסק</th>
              <th className="px-4 py-3 text-start font-medium">תוכנית</th>
              <th className="px-4 py-3 text-start font-medium">חשבונות</th>
              <th className="px-4 py-3 text-start font-medium">הצטרף</th>
              <th className="px-4 py-3 text-start font-medium">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {(profiles ?? []).map((p) => {
              const tier = tierByUser.get(p.id);
              return (
                <tr key={p.id} className="border-t border-border">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">
                      {p.full_name ?? "—"}
                      {p.role === "admin" && (
                        <span className="ms-2 align-middle">
                          <Badge tone="gray">מנהל</Badge>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-muted-2">
                      {p.business_name ?? ""}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {tier ? planByTier(tier).name : "ללא"}
                  </td>
                  <td className="px-4 py-3 text-muted">
                    {accountsByUser.get(p.id) ?? 0}
                  </td>
                  <td className="px-4 py-3 text-muted-2">
                    {dateFmt.format(new Date(p.created_at))}
                  </td>
                  <td className="px-4 py-3">
                    {p.role !== "admin" && (
                      <form action={startImpersonation}>
                        <input type="hidden" name="target_id" value={p.id} />
                        <Button type="submit" variant="secondary" size="sm">
                          התחזות
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
