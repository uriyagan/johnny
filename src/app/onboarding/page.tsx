import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { OnboardingForm } from "@/components/onboarding/onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: profile } = await supabase
    .from("business_profiles")
    .select("completed")
    .eq("user_id", user.id)
    .maybeSingle();

  if (profile?.completed) redirect("/dashboard");

  return (
    <div className="min-h-screen overflow-y-auto bg-background px-4 py-12">
      <div className="mx-auto max-w-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">
            ג׳וני רוצה להכיר את העסק שלך 👋
          </h1>
          <p className="mt-2 text-muted">
            כמה פרטים קצרים — וזהו. ככל שאדע יותר, כך אצור לך מודעות טובות יותר.
            תמיד אפשר לעדכן בהמשך.
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-surface p-6">
          <OnboardingForm />
        </div>
      </div>
    </div>
  );
}
