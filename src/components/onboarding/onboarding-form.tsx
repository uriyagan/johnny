"use client";

import { useFormState } from "react-dom";
import {
  saveBusinessProfile,
  type OnboardingState,
} from "@/lib/actions/onboarding";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileDropzone } from "@/components/ui/file-dropzone";

const initial: OnboardingState = {};

function Field({
  name,
  label,
  hint,
  textarea,
  placeholder,
  required,
}: {
  name: string;
  label: string;
  hint?: string;
  textarea?: boolean;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <Label htmlFor={name}>{label}</Label>
      {textarea ? (
        <textarea
          id={name}
          name={name}
          rows={3}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
      ) : (
        <Input id={name} name={name} placeholder={placeholder} required={required} />
      )}
      {hint && <p className="mt-1 text-xs text-muted-2">{hint}</p>}
    </div>
  );
}

export function OnboardingForm() {
  const [state, action] = useFormState(saveBusinessProfile, initial);

  return (
    <form action={action} className="space-y-5">
      <Field
        name="business_name"
        label="שם העסק *"
        placeholder="לדוגמה: סטודיו אוריה גנור"
        required
      />
      <Field
        name="industry"
        label="תחום העיסוק"
        placeholder="לדוגמה: עיצוב גרפי, מסעדנות, אופנה"
      />
      <Field
        name="description"
        label="ספרו לנו על העסק"
        textarea
        placeholder="מה אתם עושים, מה מייחד אתכם"
      />
      <Field
        name="products_services"
        label="מוצרים / שירותים מרכזיים"
        textarea
        placeholder="מה תרצו לקדם בפרסום"
      />
      <Field
        name="target_audience"
        label="קהל היעד"
        placeholder="למי אתם פונים? (גיל, מיקום, תחומי עניין)"
      />
      <Field
        name="brand_voice"
        label="שפת המותג"
        placeholder="לדוגמה: צעיר וכיפי / מקצועי ורציני"
      />
      <Field
        name="brand_colors"
        label="צבעי המותג"
        placeholder="לדוגמה: ירוק, שחור, לבן"
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="website" label="אתר אינטרנט" placeholder="https://..." />
        <Field
          name="instagram_handle"
          label="אינסטגרם (אם יש)"
          placeholder="@username"
        />
      </div>

      <div>
        <Label>לוגו (אופציונלי)</Label>
        <FileDropzone
          name="logo"
          accept="image/*"
          label="גררו לוגו לכאן או לחצו לבחירה"
          hint="PNG / JPG — עד 5MB"
        />
      </div>

      {state.error && <p className="text-sm text-red-400">{state.error}</p>}

      <SubmitButton className="w-full" pendingLabel="שומר…">
        סיימתי — בוא נתחיל 🚀
      </SubmitButton>
    </form>
  );
}
