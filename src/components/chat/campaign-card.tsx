"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  listMetaPages,
  publishCampaign,
} from "@/lib/actions/publish-campaign";
import type { CampaignDraft } from "@/lib/ai/types";
import type { MetaPage } from "@/lib/ads/types";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const CTA_LABEL: Record<string, string> = {
  SHOP_NOW: "לקנייה",
  LEARN_MORE: "מידע נוסף",
  SIGN_UP: "הרשמה",
  CONTACT_US: "צרו קשר",
  BOOK_TRAVEL: "להזמנה",
};
const ils = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  maximumFractionDigits: 0,
});

export function CampaignCard({
  draft,
  imageUrl,
}: {
  draft: CampaignDraft;
  imageUrl: string | null;
}) {
  const [pages, setPages] = useState<MetaPage[]>([]);
  const [pageId, setPageId] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listMetaPages().then((p) => {
      if (active) {
        setPages(p);
        setPageId((c) => c || p[0]?.id || "");
      }
    });
    return () => {
      active = false;
    };
  }, []);

  function publish() {
    if (publishing) return;
    setError(null);
    setPublishing(true);
    publishCampaign({ draft, imageUrl, pageId, linkUrl }).then((res) => {
      setPublishing(false);
      if (res.ok) setPublishedId(res.campaignId);
      else setError(res.error);
    });
  }

  return (
    <div className="w-full max-w-md self-end overflow-hidden rounded-2xl border border-border bg-surface">
      {imageUrl ? (
        <div className="relative h-44 w-full bg-surface-2">
          <Image src={imageUrl} alt="creative" fill sizes="400px" className="object-cover" />
        </div>
      ) : null}
      <div className="p-4">
        <p className="text-sm text-foreground">{draft.primaryText}</p>
        <p className="mt-1 font-bold text-foreground">{draft.headline}</p>
        <p className="text-sm text-muted">{draft.description}</p>
        <span className="mt-2 inline-block rounded-md bg-surface-2 px-3 py-1 text-xs text-foreground">
          {CTA_LABEL[draft.callToAction] ?? draft.callToAction}
        </span>

        <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-surface-2 p-2">
            <p className="text-muted-2">תקציב יומי</p>
            <p className="text-foreground">{ils.format(draft.dailyBudgetIls)}</p>
          </div>
          <div className="rounded-lg bg-surface-2 p-2">
            <p className="text-muted-2">קהל</p>
            <p className="text-foreground">
              גילאי {draft.audience.ageMin}-{draft.audience.ageMax}
            </p>
          </div>
        </div>

        {publishedId ? (
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-3 text-sm text-emerald-200">
            הקמפיין נוצר במצב מושהה ⏸️ —{" "}
            <Link href="/campaigns" className="underline">
              לצפייה בקמפיינים
            </Link>
          </div>
        ) : (
          <div className="mt-4 space-y-2 border-t border-border pt-3">
            <select
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border bg-surface-2 px-2 text-sm text-foreground focus:outline-none"
            >
              {pages.length === 0 && <option value="">לא נמצאו עמודים</option>}
              {pages.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            <input
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              dir="ltr"
              placeholder="https://your-site.com (כתובת יעד)"
              className="h-10 w-full rounded-lg border border-border bg-surface-2 px-2 text-sm text-foreground focus:outline-none"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button onClick={publish} disabled={publishing || !pageId} size="sm" className="w-full">
              {publishing ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner className="h-4 w-4" /> מפרסם…
                </span>
              ) : (
                "פרסום ל‑Meta (מושהה)"
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
