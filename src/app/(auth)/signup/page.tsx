import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { SignupForm } from "@/components/auth/signup-form";

export default async function SignupPage() {
  if (await getUser()) redirect("/dashboard");

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">יצירת חשבון</h2>
      <SignupForm />
    </div>
  );
}
