import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { PLANS, planByTier, type Tier } from "@/lib/billing/plans";
import { getBillingProvider } from "@/lib/billing";
import {
  changePlan,
  cancelSubscription,
  resumeSubscription,
} from "@/lib/actions/billing";
import { PaymentForm } from "@/components/billing/payment-form";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type SubStatus = Database["public"]["Enums"]["subscription_status"];

const STATUS: Record<SubStatus, { label: string; tone: BadgeTone }> = {
  active: { label: "פעיל", tone: "green" },
  trialing: { label: "תקופת ניסיון", tone: "green" },
  past_due: { label: "תשלום נכשל", tone: "red" },
  unpaid: { label: "לא שולם", tone: "red" },
  canceled: { label: "בוטל", tone: "gray" },
  incomplete: { label: "ממתין להשלמה", tone: "yellow" },
  incomplete_expired: { label: "פג תוקף", tone: "gray" },
};

const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});
const dateFmt = new Intl.DateTimeFormat("he-IL", { dateStyle: "long" });

export default async function BillingPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("tier, status, current_period_end, cancel_at_period_end")
    .eq("user_id", user.id)
    .maybeSingle();

  const billing = getBillingProvider();
  const [invoices, paymentMethod] = await Promise.all([
    billing.listInvoices(),
    billing.getPaymentMethod(),
  ]);

  const currentTier = (sub?.tier ?? null) as Tier | null;
  const status = sub ? STATUS[sub.status] : null;

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-foreground">מנוי וחיובים</h1>
      <p className="mt-1 text-muted">ניהול התוכנית, אמצעי התשלום והחשבוניות.</p>
      <p className="mt-2 inline-block rounded-md bg-amber-500/10 px-2.5 py-1 text-xs text-amber-300">
        מצב הדגמה — לא מתבצע חיוב אמיתי
      </p>

      {/* Current plan */}
      <section className="mt-6 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted-2">התוכנית שלך</h2>
        {currentTier && status ? (
          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-lg font-bold text-foreground">
                {planByTier(currentTier).name} ·{" "}
                {ils.format(planByTier(currentTier).priceIls)} לחודש
              </p>
              {sub?.current_period_end && (
                <p className="mt-1 text-sm text-muted-2">
                  {sub.cancel_at_period_end
                    ? `המנוי יסתיים בתאריך ${dateFmt.format(new Date(sub.current_period_end))}`
                    : `מתחדש בתאריך ${dateFmt.format(new Date(sub.current_period_end))}`}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <Badge tone={status.tone}>{status.label}</Badge>
              {sub?.cancel_at_period_end ? (
                <form action={resumeSubscription}>
                  <Button type="submit" variant="secondary" size="sm">
                    חידוש המנוי
                  </Button>
                </form>
              ) : (
                <form action={cancelSubscription}>
                  <Button type="submit" variant="ghost" size="sm">
                    ביטול מנוי
                  </Button>
                </form>
              )}
            </div>
          </div>
        ) : (
          <p className="mt-2 text-muted">
            אין לך עדיין תוכנית פעילה. בחרו תוכנית כדי להתחיל.
          </p>
        )}
      </section>

      {/* Plan picker */}
      <h2 className="mt-8 text-lg font-semibold text-foreground">התוכניות</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => {
          const isCurrent = plan.tier === currentTier;
          return (
            <div
              key={plan.tier}
              className={cn(
                "flex flex-col rounded-2xl border bg-surface p-5",
                isCurrent ? "border-emerald-500 ring-1 ring-emerald-500" : "border-border",
              )}
            >
              <p className="font-semibold text-foreground">{plan.name}</p>
              <p className="mt-1 text-2xl font-bold text-foreground">
                {ils.format(plan.priceIls)}
                <span className="text-sm font-normal text-muted-2"> / חודש</span>
              </p>
              <ul className="mt-3 flex-1 space-y-1 text-sm text-muted">
                {plan.features.map((f) => (
                  <li key={f}>• {f}</li>
                ))}
              </ul>
              <div className="mt-4">
                {isCurrent ? (
                  <Badge tone="green">התוכנית הנוכחית</Badge>
                ) : (
                  <form action={changePlan}>
                    <input type="hidden" name="tier" value={plan.tier} />
                    <Button type="submit" size="sm" className="w-full">
                      מעבר לתוכנית
                    </Button>
                  </form>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Payment method */}
      <section className="mt-8 rounded-2xl border border-border bg-surface p-5">
        <h2 className="text-sm font-medium text-muted-2">אמצעי תשלום</h2>
        {paymentMethod && (
          <p className="mt-2 text-foreground">
            <span className="font-medium uppercase">{paymentMethod.brand}</span>{" "}
            •••• {paymentMethod.last4} · תוקף {paymentMethod.expMonth}/
            {paymentMethod.expYear}
          </p>
        )}
        <div className="mt-3">
          <PaymentForm />
        </div>
      </section>

      {/* Invoices */}
      <h2 className="mt-8 text-lg font-semibold text-foreground">חשבוניות</h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface">
        <table className="w-full text-sm">
          <thead className="bg-background text-muted-2">
            <tr>
              <th className="px-4 py-3 text-start font-medium">מספר</th>
              <th className="px-4 py-3 text-start font-medium">תאריך</th>
              <th className="px-4 py-3 text-start font-medium">סכום</th>
              <th className="px-4 py-3 text-start font-medium">סטטוס</th>
              <th className="px-4 py-3 text-start font-medium">קבלה</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((inv) => (
              <tr key={inv.id} className="border-t border-border">
                <td className="px-4 py-3 text-muted" dir="ltr">
                  {inv.number}
                </td>
                <td className="px-4 py-3 text-muted">
                  {dateFmt.format(new Date(inv.createdAt))}
                </td>
                <td className="px-4 py-3 text-muted">
                  {ils.format(inv.amountIls)}
                </td>
                <td className="px-4 py-3">
                  <Badge tone={inv.status === "paid" ? "green" : "yellow"}>
                    {inv.status === "paid" ? "שולם" : "ממתין"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <a
                    href={inv.pdfUrl}
                    className="text-emerald-400 hover:underline"
                  >
                    הורדה
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
