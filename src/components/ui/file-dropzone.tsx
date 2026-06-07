"use client";

import { useRef, useState } from "react";
import { UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";

export function FileDropzone({
  name,
  accept,
  label = "גררו קובץ לכאן או לחצו לבחירה",
  hint,
}: {
  name: string;
  accept?: string;
  label?: string;
  hint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function setFile(file: File | null) {
    setFileName(file?.name ?? null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview(file && file.type.startsWith("image/") ? URL.createObjectURL(file) : null);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (!file || !inputRef.current) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    inputRef.current.files = dt.files;
    setFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-6 text-center transition-colors",
        dragging
          ? "border-emerald-500 bg-emerald-500/10"
          : "border-border bg-surface-2 hover:border-emerald-500/50",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        name={name}
        accept={accept}
        className="hidden"
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={preview}
          alt="preview"
          className="max-h-32 rounded-lg object-contain"
        />
      ) : (
        <UploadCloud className="h-9 w-9 text-muted-2" />
      )}

      <p className="text-sm font-medium text-foreground">
        {fileName ?? label}
      </p>
      {hint && !fileName && <p className="text-xs text-muted-2">{hint}</p>}
    </div>
  );
}
