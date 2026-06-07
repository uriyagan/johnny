"use client";

import { useFormState } from "react-dom";
import { uploadAsset, type AssetUploadState } from "@/lib/actions/assets";
import { SubmitButton } from "@/components/ui/submit-button";
import { FileDropzone } from "@/components/ui/file-dropzone";

const initial: AssetUploadState = {};

export function UploadForm() {
  const [state, action] = useFormState(uploadAsset, initial);

  return (
    <form
      action={action}
      className="rounded-2xl border border-dashed border-border bg-surface p-5"
    >
      <p className="text-sm font-medium text-muted">
        העלו תמונה או סרטון ואנחנו ננתח אותם ונציע טקסטים
      </p>
      <div className="mt-3">
        <FileDropzone
          name="file"
          accept="image/*,video/mp4,application/pdf"
          label="גררו תמונה/סרטון לכאן או לחצו לבחירה"
          hint="תמונה, וידאו (MP4) או PDF — עד 10MB"
        />
        <div className="mt-3">
          <SubmitButton size="sm" pendingLabel="מעלה ומנתח…">
            העלאה וניתוח
          </SubmitButton>
        </div>
      </div>

      {state.error && (
        <p className="mt-3 text-sm text-red-400">{state.error}</p>
      )}
      {state.ok && (
        <p className="mt-3 text-sm text-emerald-400">
          הקובץ הועלה ונותח בהצלחה ✓
        </p>
      )}
    </form>
  );
}
