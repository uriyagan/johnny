import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTierLimitInfo } from "@/lib/accounts";
import { disconnectAccount } from "@/lib/actions/accounts";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { USE_MOCKS_ADS } from "@/lib/config";
import type { Database } from "@/types/database";

const META_MSG: Record<string, string> = {
  connected: "חשבון Meta חובר בהצלחה ✓",
  denied: "החיבור בוטל.",
  state: "שגיאת אבטחה בחיבור, נסו שוב.",
  config: "חסרה הגדרת אפליקציית Meta.",
  error: "החיבור נכשל. נסו שוב.",
};

type AccountStatus = Database["public"]["Enums"]["ad_account_status"];

const STATUS: Record<AccountStatus, { label: string; tone: BadgeTone }> = {
  connected: { label: "מחובר", tone: "green" },
  pending: { label: "ממתין", tone: "yellow" },
  disconnected: { label: "מנותק", tone: "gray" },
  error: { label: "שגיאה", tone: "red" },
};

export default async function AccountsPage({
  searchParams,
}: {
  searchParams: { meta?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: accounts } = await supabase
    .from("ad_accounts")
    .select("id, name, external_account_id, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  const { limit, used, canAdd } = await getTierLimitInfo(supabase, user.id);
  const list = accounts ?? [];

  // Live mode connects via Meta OAuth; mock mode uses the in-app picker.
  const connectHref = USE_MOCKS_ADS ? "/accounts/connect" : "/api/meta/connect";
  const metaNotice = searchParams.meta ? META_MSG[searchParams.meta] : undefined;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      {metaNotice && (
        <p
          className={`mb-4 rounded-md px-3 py-2 text-sm ${
            searchParams.meta === "connected"
              ? "bg-emerald-500/10 text-emerald-300"
              : "bg-red-500/10 text-red-300"
          }`}
        >
          {metaNotice}
        </p>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">חשבונות מודעות</h1>
          <p className="mt-1 text-muted">
            מחוברים {used} מתוך {limit ?? "∞"} בתוכנית שלך.
          </p>
        </div>
        {canAdd ? (
          <Link
            href={connectHref}
            className="inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            + חיבור חשבון
          </Link>
        ) : (
          <Link
            href="/billing"
            className="inline-flex h-11 items-center rounded-lg bg-surface-2 px-5 text-sm font-medium text-muted hover:bg-white/10"
          >
            שדרגו את התוכנית
          </Link>
        )}
      </div>

      {list.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <p className="text-muted-2">עדיין לא חיברתם חשבון מודעות.</p>
          <Link
            href={connectHref}
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
                className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
              >
                <div>
                  <p className="font-medium text-foreground">
                    {acc.name ?? "חשבון מודעות"}
                  </p>
                  <p className="text-xs text-muted-2" dir="ltr">
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
