"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { signup, type AuthState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthState = {};

export function SignupForm() {
  const [state, formAction] = useFormState(signup, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <Label htmlFor="full_name">שם מלא</Label>
        <Input id="full_name" name="full_name" autoComplete="name" required />
      </div>

      <div>
        <Label htmlFor="business_name">שם העסק</Label>
        <Input id="business_name" name="business_name" autoComplete="organization" />
      </div>

      <div>
        <Label htmlFor="email">אימייל</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          dir="ltr"
          placeholder="name@example.com"
          required
        />
      </div>

      <div>
        <Label htmlFor="password">סיסמה</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
        />
        <p className="mt-1 text-xs text-gray-400">לפחות 6 תווים</p>
      </div>

      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" pendingLabel="נרשם...">
        הרשמה
      </SubmitButton>

      <p className="pt-2 text-center text-sm text-gray-600">
        כבר יש לך חשבון?{" "}
        <Link href="/login" className="font-medium text-emerald-600 hover:underline">
          להתחברות
        </Link>
      </p>
    </form>
  );
}
