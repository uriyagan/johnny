import Image from "next/image";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { deleteAsset } from "@/lib/actions/assets";
import { UploadForm } from "@/components/assets/upload-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AssetAnalysis, GeneratedCopy } from "@/lib/ai/types";

const KIND_LABEL: Record<string, string> = {
  image: "תמונה",
  video: "סרטון",
  document: "מסמך",
};

export default async function AssetsPage() {
  const user = await requireUser();
  const supabase = createClient();

  const { data: assets } = await supabase
    .from("assets")
    .select(
      "id, storage_path, original_filename, mime_type, kind, ai_analysis, generated_copy",
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const list = assets ?? [];

  // Signed URLs for image previews (private bucket).
  const previews = new Map<string, string>();
  await Promise.all(
    list
      .filter((a) => a.kind === "image")
      .map(async (a) => {
        const { data } = await supabase.storage
          .from("assets")
          .createSignedUrl(a.storage_path, 3600);
        if (data?.signedUrl) previews.set(a.id, data.signedUrl);
      }),
  );

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900">מדיה</h1>
      <p className="mt-1 text-gray-600">
        העלו תמונות וסרטונים — נשפר אותם ונכתוב טקסטים שמוכרים.
      </p>

      <div className="mt-6">
        <UploadForm />
      </div>

      {list.length === 0 ? (
        <p className="mt-8 text-sm text-gray-500">עדיין לא העליתם קבצים.</p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => {
            const analysis = a.ai_analysis as unknown as AssetAnalysis | null;
            const copy = a.generated_copy as unknown as GeneratedCopy | null;
            const preview = previews.get(a.id);
            return (
              <div
                key={a.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white"
              >
                <div className="relative h-40 bg-gray-100">
                  {preview ? (
                    <Image
                      src={preview}
                      alt={a.original_filename ?? "asset"}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-3xl text-gray-300">
                      {a.kind === "video" ? "🎬" : "📄"}
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-medium text-gray-900">
                      {a.original_filename}
                    </p>
                    <Badge tone="gray">{KIND_LABEL[a.kind] ?? a.kind}</Badge>
                  </div>

                  {analysis && analysis.attributes.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500">
                        מה זיהינו:
                      </p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {analysis.attributes.map((attr) => (
                          <span
                            key={attr}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                          >
                            {attr}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {copy && copy.variants.length > 0 && (
                    <div className="mt-3">
                      <p className="text-xs font-medium text-gray-500">
                        הצעות לטקסט:
                      </p>
                      <ul className="mt-1 space-y-1 text-xs text-gray-600">
                        {copy.variants.slice(0, 2).map((v) => (
                          <li key={v}>• {v}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <div className="mt-4 flex justify-end">
                    <form action={deleteAsset}>
                      <input type="hidden" name="id" value={a.id} />
                      <Button type="submit" variant="ghost" size="sm">
                        מחיקה
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
