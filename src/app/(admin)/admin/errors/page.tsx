import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type Source = Database["public"]["Enums"]["error_source"];
type Severity = Database["public"]["Enums"]["error_severity"];

const SEV_TONE: Record<Severity, BadgeTone> = {
  warning: "yellow",
  error: "red",
  fatal: "red",
};

const dateFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: { source?: string };
}) {
  const admin = createAdminClient();

  let query = admin
    .from("app_errors")
    .select("id, source, severity, message, route, user_id, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const source = searchParams.source as Source | undefined;
  if (source === "client" || source === "server") {
    query = query.eq("source", source);
  }

  const [{ data: errors }, totals] = await Promise.all([
    query,
    admin
      .from("app_errors")
      .select("id", { count: "exact", head: true })
      .gte(
        "created_at",
        new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      ),
  ]);

  const last24h = totals.count ?? 0;
  const filters: { key?: Source; label: string }[] = [
    { label: "הכל" },
    { key: "client", label: "לקוח" },
    { key: "server", label: "שרת" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">שגיאות</h1>
        <span className="text-sm text-muted-2">{last24h} ב‑24 שעות אחרונות</span>
      </div>

      <div className="mt-4 flex gap-2">
        {filters.map((f) => {
          const active = (searchParams.source ?? "") === (f.key ?? "");
          return (
            <Link
              key={f.label}
              href={f.key ? `/admin/errors?source=${f.key}` : "/admin/errors"}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                active
                  ? "bg-emerald-600 text-white"
                  : "bg-surface-2 text-muted hover:bg-white/10"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-background text-muted-2">
            <tr>
              <th className="px-4 py-3 text-start font-medium">זמן</th>
              <th className="px-4 py-3 text-start font-medium">מקור</th>
              <th className="px-4 py-3 text-start font-medium">חומרה</th>
              <th className="px-4 py-3 text-start font-medium">הודעה</th>
              <th className="px-4 py-3 text-start font-medium">מסך</th>
            </tr>
          </thead>
          <tbody>
            {(errors ?? []).map((e) => (
              <tr key={e.id} className="border-t border-border align-top">
                <td className="whitespace-nowrap px-4 py-3 text-muted-2">
                  {dateFmt.format(new Date(e.created_at))}
                </td>
                <td className="px-4 py-3 text-muted">
                  {e.source === "client" ? "לקוח" : "שרת"}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={SEV_TONE[e.severity]}>{e.severity}</Badge>
                </td>
                <td className="px-4 py-3 text-foreground">
                  <span className="line-clamp-2">{e.message}</span>
                </td>
                <td className="px-4 py-3 text-muted-2" dir="ltr">
                  {e.route ?? "—"}
                </td>
              </tr>
            ))}
            {(errors ?? []).length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-center text-muted-2">
                  אין שגיאות 🎉
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
