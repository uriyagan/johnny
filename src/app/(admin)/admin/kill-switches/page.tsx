import { createAdminClient } from "@/lib/supabase/admin";
import { toggleKillSwitch } from "@/lib/actions/admin";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/database";

type KillType = Database["public"]["Enums"]["killswitch_type"];

const SWITCHES: { type: KillType; title: string; description: string }[] = [
  {
    type: "api_execution",
    title: "עצירת כל פעולות ה‑API",
    description: "מונע כל פנייה לרשתות הפרסום (Meta) — עצירת חירום מלאה.",
  },
  {
    type: "spending",
    title: "חסימת הוצאה",
    description: "מונע הגדלות תקציב והפעלת קמפיינים שמוציאים כסף.",
  },
];

export default async function KillSwitchesPage() {
  const admin = createAdminClient();
  const { data: rows } = await admin
    .from("kill_switches")
    .select("type, enabled")
    .eq("scope", "global")
    .is("target_user_id", null);

  const enabledMap = new Map(
    (rows ?? []).map((r) => [r.type as KillType, r.enabled]),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground">מתגי חירום</h1>
      <p className="mt-1 text-muted">
        שליטה גלובלית על כלל הלקוחות. להשתמש בזהירות.
      </p>

      <div className="mt-6 space-y-3">
        {SWITCHES.map((sw) => {
          const enabled = enabledMap.get(sw.type) ?? false;
          return (
            <div
              key={sw.type}
              className="flex items-center justify-between rounded-2xl border border-border bg-surface p-5"
            >
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">{sw.title}</p>
                  <Badge tone={enabled ? "red" : "gray"}>
                    {enabled ? "פעיל" : "כבוי"}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-muted-2">{sw.description}</p>
              </div>
              <form action={toggleKillSwitch}>
                <input type="hidden" name="type" value={sw.type} />
                <input
                  type="hidden"
                  name="enabled"
                  value={enabled ? "false" : "true"}
                />
                <Button
                  type="submit"
                  variant={enabled ? "secondary" : "danger"}
                  size="sm"
                >
                  {enabled ? "כיבוי" : "הפעלה"}
                </Button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
