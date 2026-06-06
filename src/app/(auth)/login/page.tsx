import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";

const messages: Record<string, string> = {
  "confirm-email": "כמעט סיימנו! שלחנו לך אימייל לאישור החשבון.",
  "auth-error": "אירעה שגיאה באימות. נסו להתחבר שוב.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  if (await getUser()) redirect("/dashboard");

  const notice = searchParams.message
    ? messages[searchParams.message]
    : undefined;

  return (
    <div className="space-y-5">
      <h2 className="text-xl font-semibold text-gray-900">התחברות</h2>
      {notice && (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {notice}
        </p>
      )}
      <LoginForm />
    </div>
  );
}
