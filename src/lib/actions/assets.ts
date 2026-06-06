"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { getAIProvider } from "@/lib/ai";
import type { Database, Json } from "@/types/database";

export type AssetUploadState = { ok?: boolean; error?: string };

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

function kindFromMime(
  mime: string,
): Database["public"]["Enums"]["asset_kind"] {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  return "document";
}

/** Uploads a media file to Storage and runs AI analysis (Pillar 4). */
export async function uploadAsset(
  _prev: AssetUploadState,
  formData: FormData,
): Promise<AssetUploadState> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "נא לבחור קובץ" };
  }
  if (file.size > MAX_BYTES) {
    return { error: "הקובץ גדול מדי (עד 10MB)" };
  }
  const mime = file.type;
  const allowed =
    mime.startsWith("image/") ||
    mime.startsWith("video/") ||
    mime === "application/pdf";
  if (!allowed) return { error: "סוג קובץ לא נתמך" };

  const user = await requireUser();
  const supabase = createClient();

  const safeName = file.name.replace(/[^\w.\-]+/g, "_");
  const path = `${user.id}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadErr } = await supabase.storage
    .from("assets")
    .upload(path, file, { contentType: mime });
  if (uploadErr) return { error: "ההעלאה נכשלה" };

  const ai = getAIProvider();
  const [analysis, copy] = await Promise.all([
    ai.analyzeAsset({ filename: file.name, mimeType: mime }),
    ai.generateCopy({ product: file.name }),
  ]);

  const { error: insertErr } = await supabase.from("assets").insert({
    user_id: user.id,
    storage_path: path,
    original_filename: file.name,
    mime_type: mime,
    kind: kindFromMime(mime),
    status: "ready",
    ai_analysis: analysis as unknown as Json,
    generated_copy: copy as unknown as Json,
  });
  if (insertErr) {
    // Roll back the orphaned upload.
    await supabase.storage.from("assets").remove([path]);
    return { error: "שמירת הקובץ נכשלה" };
  }

  revalidatePath("/assets");
  return { ok: true };
}

/** Deletes an asset (storage object + DB row). */
export async function deleteAsset(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim();
  if (!id) return;

  const user = await requireUser();
  const supabase = createClient();

  const { data: asset } = await supabase
    .from("assets")
    .select("storage_path")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (asset) {
    await supabase.storage.from("assets").remove([asset.storage_path]);
    await supabase.from("assets").delete().eq("id", id).eq("user_id", user.id);
  }

  revalidatePath("/assets");
}
