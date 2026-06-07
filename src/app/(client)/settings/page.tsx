import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { saveBudgetCap, checkBudgetNow } from "@/lib/actions/settings";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});
const dateTimeFmt = new Intl.DateTimeFormat("he-IL", {
  dateStyle: "short",
  timeStyle: "short",
});

const CHECK_MSG: Record<string, string> = {
  ok: "בדקנו — אתה הרבה מתחת לתקרה. הכל תקין ✓",
  warning: "שים לב: אתה מתקרב לתקרת התקציב.",
  paused: "הגעת לתקרה — השהינו את הקמפיינים כדי להגן עליך.",
  no_cap: "עדיין לא הגדרת תקרת תקציב.",
};

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string; error?: string; checked?: string };
}) {
  const user = await requireUser();
  const supabase = createClient();

  const { data: cap } = await supabase
    .from("budget_caps")
    .select("monthly_cap_ils, threshold_pct, hard_pause_enabled, spend_current_period")
    .eq("user_id", user.id)
    .is("ad_account_id", null)
    .maybeSingle();

  const { data: notifications } = await supabase
    .from("notifications")
    .select("id, type, title, body, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8">
      <h1 className="text-2xl font-bold text-foreground">הגדרות</h1>
      <p className="mt-1 text-muted">תקרת תקציב חודשית והתראות.</p>

      {searchParams.saved && (
        <p className="mt-4 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
          ההגדרות נשמרו ✓
        </p>
      )}
      {searchParams.error === "cap" && (
        <p className="mt-4 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
          נא להזין סכום תקין.
        </p>
      )}
      {searchParams.checked && CHECK_MSG[searchParams.checked] && (
        <p className="mt-4 rounded-md bg-blue-500/10 px-3 py-2 text-sm text-blue-300">
          {CHECK_MSG[searchParams.checked]}
        </p>
      )}

      {/* Budget cap */}
      <section className="mt-6 max-w-lg rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-lg font-semibold text-foreground">תקרת תקציב חודשית</h2>
        <p className="mt-1 text-sm text-muted-2">
          נעצור אוטומטית את הקמפיינים אם תגיע לסכום הזה — כדי שלא תוציא יותר ממה
          שתכננת.
        </p>

        {cap && (
          <p className="mt-3 text-sm text-muted">
            ניצול נוכחי: {ils.format(cap.spend_current_period)} מתוך{" "}
            {ils.format(cap.monthly_cap_ils)}
          </p>
        )}

        <form action={saveBudgetCap} className="mt-4 space-y-4">
          <div>
            <Label htmlFor="monthly_cap_ils">תקרה חודשית (₪)</Label>
            <Input
              id="monthly_cap_ils"
              name="monthly_cap_ils"
              type="number"
              min={1}
              step={50}
              dir="ltr"
              defaultValue={cap?.monthly_cap_ils ?? ""}
              placeholder="3000"
              required
            />
          </div>
          <div>
            <Label htmlFor="threshold_pct">התראה כשמגיעים ל‑% מהתקרה</Label>
            <Input
              id="threshold_pct"
              name="threshold_pct"
              type="number"
              min={1}
              max={100}
              dir="ltr"
              defaultValue={cap?.threshold_pct ?? 90}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              name="hard_pause"
              defaultChecked={cap?.hard_pause_enabled ?? true}
              className="h-4 w-4 rounded border-border text-emerald-400"
            />
            עצור קמפיינים אוטומטית כשמגיעים לתקרה
          </label>

          <div className="flex gap-2">
            <Button type="submit">שמירה</Button>
          </div>
        </form>

        <form action={checkBudgetNow} className="mt-3">
          <Button type="submit" variant="secondary" size="sm">
            בדוק עכשיו
          </Button>
        </form>
      </section>

      {/* Notifications */}
      <h2 className="mt-8 text-lg font-semibold text-foreground">התראות אחרונות</h2>
      {notifications && notifications.length > 0 ? (
        <ul className="mt-4 max-w-lg space-y-3">
          {notifications.map((n) => (
            <li
              key={n.id}
              className="rounded-2xl border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-foreground">{n.title}</p>
                <span className="text-xs text-muted-2">
                  {dateTimeFmt.format(new Date(n.created_at))}
                </span>
              </div>
              {n.body && <p className="mt-1 text-sm text-muted">{n.body}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-sm text-muted-2">אין התראות עדיין.</p>
      )}
    </div>
  );
}
