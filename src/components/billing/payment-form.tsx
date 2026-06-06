"use client";

import { useState } from "react";
import { useFormState } from "react-dom";
import { savePaymentMethod, type CardState } from "@/lib/actions/billing";
import { Label } from "@/components/ui/label";
import { SubmitButton } from "@/components/ui/submit-button";
import { Button } from "@/components/ui/button";

const initial: CardState = {};

export function PaymentForm() {
  const [open, setOpen] = useState(false);
  const [state, action] = useFormState(savePaymentMethod, initial);

  if (!open) {
    return (
      <div className="space-y-2">
        {state.ok && (
          <p className="text-sm text-emerald-600">פרטי התשלום עודכנו בהצלחה ✓</p>
        )}
        <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
          עדכון אמצעי תשלום
        </Button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-4">
      {/* Embedded card fields (Stripe Elements replaces this container at go-live). */}
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div>
          <Label htmlFor="card-number">מספר כרטיס</Label>
          <input
            id="card-number"
            name="number"
            inputMode="numeric"
            dir="ltr"
            placeholder="1234 1234 1234 1234"
            className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="card-exp">תוקף</Label>
            <input
              id="card-exp"
              name="exp"
              dir="ltr"
              placeholder="MM/YY"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
          <div>
            <Label htmlFor="card-cvc">CVC</Label>
            <input
              id="card-cvc"
              name="cvc"
              inputMode="numeric"
              dir="ltr"
              placeholder="123"
              className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {state.error && <p className="text-sm text-red-600">{state.error}</p>}

      <div className="flex gap-2">
        <SubmitButton size="sm" pendingLabel="שומר…">
          שמירה
        </SubmitButton>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          ביטול
        </Button>
      </div>
    </form>
  );
}
