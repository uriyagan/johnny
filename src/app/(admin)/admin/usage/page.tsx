import { createAdminClient } from "@/lib/supabase/admin";

const usd = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});
const dateFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

const OP_LABEL: Record<string, string> = {
  chat: "צ׳אט",
  copy: "כתיבת טקסט",
  rejection: "תרגום דחיות",
  feedback: "ניתוח משוב",
  campaign_plan: "בניית קמפיין",
  campaign_analysis: "ניתוח קמפיינים",
  asset_analysis: "ניתוח מדיה",
  image: "יצירת תמונה",
  text: "כללי",
};

export default async function AdminUsagePage() {
  const admin = createAdminClient();
  const monthStart = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  const { data: rows } = await admin
    .from("api_usage")
    .select("operation, tokens_in, tokens_out, cost_usd, created_at, metadata")
    .gte("created_at", monthStart)
    .order("created_at", { ascending: false })
    .limit(500);

  const all = rows ?? [];
  const totalCost = all.reduce((s, r) => s + Number(r.cost_usd), 0);
  const totalTokens = all.reduce(
    (s, r) => s + r.tokens_in + r.tokens_out,
    0,
  );

  const byOp = new Map<string, { calls: number; cost: number }>();
  for (const r of all) {
    const cur = byOp.get(r.operation) ?? { calls: 0, cost: 0 };
    cur.calls += 1;
    cur.cost += Number(r.cost_usd);
    byOp.set(r.operation, cur);
  }
  const breakdown = [...byOp.entries()].sort((a, b) => b[1].cost - a[1].cost);

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">עלויות</h1>
      <p className="mt-1 text-muted">שימוש ב‑AI החודש (אומדן עלות).</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="עלות החודש" value={usd.format(totalCost)} />
        <Stat label="קריאות" value={String(all.length)} />
        <Stat label="טוקנים" value={totalTokens.toLocaleString("en-US")} />
      </div>

      <h2 className="mt-8 text-lg font-semibold text-foreground">פילוח לפי פעולה</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-background text-muted-2">
            <tr>
              <th className="px-4 py-3 text-start font-medium">פעולה</th>
              <th className="px-4 py-3 text-start font-medium">קריאות</th>
              <th className="px-4 py-3 text-start font-medium">עלות</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map(([op, v]) => (
              <tr key={op} className="border-t border-border">
                <td className="px-4 py-3 text-foreground">{OP_LABEL[op] ?? op}</td>
                <td className="px-4 py-3 text-muted">{v.calls}</td>
                <td className="px-4 py-3 text-muted">{usd.format(v.cost)}</td>
              </tr>
            ))}
            {breakdown.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center text-muted-2">
                  אין נתוני שימוש החודש.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <h2 className="mt-8 text-lg font-semibold text-foreground">קריאות אחרונות</h2>
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-background text-muted-2">
            <tr>
              <th className="px-4 py-3 text-start font-medium">זמן</th>
              <th className="px-4 py-3 text-start font-medium">פעולה</th>
              <th className="px-4 py-3 text-start font-medium">טוקנים</th>
              <th className="px-4 py-3 text-start font-medium">עלות</th>
            </tr>
          </thead>
          <tbody>
            {all.slice(0, 50).map((r, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3 text-muted-2">
                  {dateFmt.format(new Date(r.created_at))}
                </td>
                <td className="px-4 py-3 text-muted">
                  {OP_LABEL[r.operation] ?? r.operation}
                </td>
                <td className="px-4 py-3 text-muted-2">
                  {(r.tokens_in + r.tokens_out).toLocaleString("en-US")}
                </td>
                <td className="px-4 py-3 text-muted">{usd.format(Number(r.cost_usd))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5">
      <p className="text-sm text-muted-2">{label}</p>
      <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    </div>
  );
}
