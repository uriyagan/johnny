"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { login, type AuthState } from "@/lib/actions/auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";

const initialState: AuthState = {};

export function LoginForm() {
  const [state, formAction] = useFormState(login, initialState);

  return (
    <form action={formAction} className="space-y-4">
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
          autoComplete="current-password"
          required
        />
      </div>

      {state.error && (
        <p className="rounded-md bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <SubmitButton className="w-full" pendingLabel="מתחבר...">
        התחברות
      </SubmitButton>

      <p className="pt-2 text-center text-sm text-muted">
        אין לך חשבון?{" "}
        <Link href="/signup" className="font-medium text-emerald-400 hover:underline">
          להרשמה
        </Link>
      </p>
    </form>
  );
}
