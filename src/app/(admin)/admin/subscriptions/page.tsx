import { createAdminClient } from "@/lib/supabase/admin";
import { planByTier, type Tier } from "@/lib/billing/plans";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import type { Database } from "@/types/database";

type SubStatus = Database["public"]["Enums"]["subscription_status"];

const STATUS: Record<SubStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "פעיל", tone: "green" },
  trialing: { label: "ניסיון", tone: "green" },
  past_due: { label: "תשלום נכשל", tone: "red" },
  unpaid: { label: "לא שולם", tone: "red" },
  canceled: { label: "בוטל", tone: "gray" },
  incomplete: { label: "ממתין", tone: "yellow" },
  incomplete_expired: { label: "פג תוקף", tone: "gray" },
};

const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "short" });

export default async function AdminSubscriptionsPage() {
  const admin = createAdminClient();

  const [{ data: subs }, { data: profiles }] = await Promise.all([
    admin
      .from("subscriptions")
      .select("user_id, tier, status, current_period_end, cancel_at_period_end")
      .order("updated_at", { ascending: false }),
    admin.from("profiles").select("id, full_name, business_name"),
  ]);

  const nameByUser = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      p.business_name || p.full_name || "—",
    ]),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">מנויים</h1>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="px-4 py-3 text-start font-medium">לקוח</th>
              <th className="px-4 py-3 text-start font-medium">תוכנית</th>
              <th className="px-4 py-3 text-start font-medium">סטטוס</th>
              <th className="px-4 py-3 text-start font-medium">חידוש</th>
            </tr>
          </thead>
          <tbody>
            {(subs ?? []).map((s) => {
              const st = STATUS[s.status];
              return (
                <tr key={s.user_id} className="border-t border-gray-100">
                  <td className="px-4 py-3 text-gray-900">
                    {nameByUser.get(s.user_id) ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-700">
                    {planByTier(s.tier as Tier).name}
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {s.cancel_at_period_end && (
                      <span className="ms-2 text-xs text-gray-400">
                        (מבוטל בסוף התקופה)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {s.current_period_end
                      ? dateFmt.format(new Date(s.current_period_end))
                      : "—"}
                  </td>
                </tr>
              );
            })}
            {(subs ?? []).length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-6 text-center text-gray-400">
                  אין מנויים עדיין.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
