import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  hasValidAdmin2FA,
  hasPendingCode,
  sendAdmin2FACode,
} from "@/lib/admin-2fa";
import { sendAdminCode, verifyAdminCode } from "@/lib/actions/admin-2fa";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default async function AdminVerifyPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string };
}) {
  const user = await requireAdmin();
  if (hasValidAdmin2FA(user.id)) redirect("/admin");

  // Auto-send a code on first visit (not on refresh within the 10-min window).
  if (!(await hasPendingCode(user.id)) && user.email) {
    try {
      await sendAdmin2FACode(user.id, user.email);
    } catch {
      /* surfaced via resend button */
    }
  }

  const maskedEmail = (user.email ?? "").replace(/^(.).*(@.*)$/, "$1***$2");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-emerald-500">אימות אזור ניהול</h1>
          <p className="mt-2 text-sm text-muted">
            שלחנו קוד בן 6 ספרות לכתובת {maskedEmail}
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          {searchParams.error && (
            <p className="mb-3 rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {searchParams.error === "format"
                ? "יש להזין קוד בן 6 ספרות."
                : "קוד שגוי או שפג תוקפו."}
            </p>
          )}
          {searchParams.sent && (
            <p className="mb-3 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
              קוד חדש נשלח ✓
            </p>
          )}

          <form action={verifyAdminCode} className="space-y-4">
            <Input
              name="code"
              inputMode="numeric"
              dir="ltr"
              placeholder="000000"
              maxLength={6}
              className="text-center text-lg tracking-[0.4em]"
              required
            />
            <Button type="submit" className="w-full">
              אימות וכניסה
            </Button>
          </form>

          <form action={sendAdminCode} className="mt-3 text-center">
            <button
              type="submit"
              className="text-sm text-muted-2 hover:text-foreground hover:underline"
            >
              שליחת קוד מחדש
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
