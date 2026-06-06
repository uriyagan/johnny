import { createAdminClient } from "@/lib/supabase/admin";
import { USE_MOCKS } from "@/lib/config";
import { Badge } from "@/components/ui/badge";

async function count(
  table: "profiles" | "ad_accounts",
): Promise<number> {
  const admin = createAdminClient();
  const { count } = await admin
    .from(table)
    .select("id", { count: "exact", head: true });
  return count ?? 0;
}

export default async function AdminOverviewPage() {
  const admin = createAdminClient();

  const [users, accounts, activeSubs] = await Promise.all([
    count("profiles"),
    count("ad_accounts"),
    admin
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("status", "active")
      .then((r) => r.count ?? 0),
  ]);

  const stats = [
    { label: "משתמשים", value: users },
    { label: "מנויים פעילים", value: activeSubs },
    { label: "חשבונות מודעות מחוברים", value: accounts },
  ];

  const providers = ["meta", "stripe", "gemini", "resend"] as const;

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">סקירה</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-border bg-surface p-5"
          >
            <p className="text-sm text-muted-2">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-8 text-lg font-semibold text-foreground">תקינות חיבורים</h2>
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {providers.map((p) => (
          <div
            key={p}
            className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
          >
            <span className="font-medium uppercase text-muted">{p}</span>
            <Badge tone={USE_MOCKS ? "yellow" : "green"}>
              {USE_MOCKS ? "מצב הדגמה" : "פעיל"}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
}
