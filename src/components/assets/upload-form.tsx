"use client";

import { useFormState } from "react-dom";
import { uploadAsset, type AssetUploadState } from "@/lib/actions/assets";
import { SubmitButton } from "@/components/ui/submit-button";

const initial: AssetUploadState = {};

export function UploadForm() {
  const [state, action] = useFormState(uploadAsset, initial);

  return (
    <form
      action={action}
      className="rounded-2xl border border-dashed border-gray-300 bg-white p-5"
    >
      <p className="text-sm font-medium text-gray-700">
        העלו תמונה או סרטון ואנחנו ננתח אותם ונציע טקסטים
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          type="file"
          name="file"
          accept="image/*,video/mp4,application/pdf"
          required
          className="text-sm text-gray-600 file:me-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-emerald-700 hover:file:bg-emerald-100"
        />
        <SubmitButton size="sm" pendingLabel="מעלה ומנתח…">
          העלאה וניתוח
        </SubmitButton>
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-600">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-3 text-sm text-emerald-600">
          הקובץ הועלה ונותח בהצלחה ✓
        </p>
      )}
    </form>
  );
}
