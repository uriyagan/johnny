import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getTierLimitInfo } from "@/lib/accounts";
import { getAdsProvider } from "@/lib/ads";
import { connectAccount } from "@/lib/actions/accounts";
import { Button } from "@/components/ui/button";

const ERRORS: Record<string, string> = {
  limit: "הגעת למספר החשבונות המרבי בתוכנית שלך.",
  exists: "החשבון הזה כבר מחובר.",
  missing: "לא נבחר חשבון.",
};

export default async function ConnectAccountPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { canAdd, limit, used } = await getTierLimitInfo(supabase, user.id);

  const { data: connected } = await supabase
    .from("ad_accounts")
    .select("external_account_id")
    .eq("user_id", user.id);
  const connectedIds = new Set(
    (connected ?? []).map((r) => r.external_account_id),
  );

  const ads = getAdsProvider();
  const available = (await ads.listAccounts()).filter(
    (a) => !connectedIds.has(a.id),
  );

  const errorMsg = searchParams.error ? ERRORS[searchParams.error] : undefined;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <Link href="/accounts" className="text-sm text-muted-2 hover:underline">
        ← חזרה לחשבונות
      </Link>

      <h1 className="mt-3 text-2xl font-bold text-foreground">חיבור חשבון Meta</h1>
      <p className="mt-1 text-muted">
        התחברנו לחשבון ה‑Meta שלך. בחרו אילו חשבונות מודעות לחבר.
      </p>

      {errorMsg && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {errorMsg}
        </p>
      )}

      {!canAdd ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="text-muted">
            חיברת {used} מתוך {limit} חשבונות. כדי לחבר עוד, שדרגו את התוכנית.
          </p>
          <Link
            href="/billing"
            className="mt-4 inline-flex h-11 items-center rounded-lg bg-emerald-600 px-5 text-sm font-medium text-white hover:bg-emerald-700"
          >
            למסך המנוי
          </Link>
        </div>
      ) : available.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-muted-2">
          כל החשבונות הזמינים כבר מחוברים 🎉
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {available.map((acc) => (
            <li
              key={acc.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-4"
            >
              <div>
                <p className="font-medium text-foreground">{acc.name}</p>
                <p className="text-xs text-muted-2" dir="ltr">
                  {acc.id}
                </p>
              </div>
              <form action={connectAccount}>
                <input type="hidden" name="external_account_id" value={acc.id} />
                <input type="hidden" name="name" value={acc.name} />
                <Button type="submit" size="sm">
                  חיבור
                </Button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
