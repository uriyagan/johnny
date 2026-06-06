import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTierLimitInfo } from "@/lib/accounts";
import { disconnectAccount } from "@/lib/actions/accounts";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

type AccountStatus = Database["public"]["Enums"]["ad_account_status"];

const STATUS: Record<AccountStatus, { label: string; tone: BadgeTone }> = {
  connected: { label: "מחובר", tone: "green" },
  pending: { label: "ממתין", tone: "yellow" },
  disconnected: { label: "מנותק", tone: "gray" },
  error: { label: "שגיאה", tone: "red" },
};

export default async function AccountsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("id, name, external_account_id, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { limit, used, canAdd } = await getTierLimitInfo(supabase, user.id);
  const list = accounts ?? [];

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">חשבונות מודעות</h1>
          <p className="mt-1 text-gray-600">
            מחוברים {used} מתוך {limit ?? "∞"} בתוכנית שלך.
          </p>
        </div>
        {canAdd ? (
          <Link
            href="/accounts/connect"
            className="inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + חיבור חשבון
          </Link>
        ) : (
          <Link
            href="/billing"
            className="inline-flex h-11 items-center rounded-lg bg-gray-100 px-5 text-sm font-medium text-gray-700 hover:bg-gray-200"
          >
            שדרגו את התוכנית
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
          <p className="text-gray-500">עדיין לא חיברתם חשבון מודעות.</p>
          <Link
            href="/accounts/connect"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            חיבור חשבון ראשון
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {list.map((acc) => {
            const s = STATUS[acc.status];
            return (
              <li
                key={acc.id}
                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">
                    {acc.name ?? "חשבון מודעות"}
                  </p>
                  <p className="text-xs text-gray-400" dir="ltr">
                    {acc.external_account_id}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge tone={s.tone}>{s.label}</Badge>
                  <form action={disconnectAccount}>
                    <input type="hidden" name="id" value={acc.id} />
                    <Button type="submit" variant="ghost" size="sm">
                      ניתוק
                    </Button>
                  </form>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
