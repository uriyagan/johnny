"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useTransition } from "react";
import {
  buildCampaignDraft,
  type BuildResult,
} from "@/lib/actions/campaign-builder";
import type { CampaignDraft } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";

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

export default function NewCampaignPage() {
  const [brief, setBrief] = useState("");
  const [answers, setAnswers] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [draft, setDraft] = useState<CampaignDraft | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run(extraAnswers?: string) {
    setError(null);
    start(async () => {
      const res: BuildResult = await buildCampaignDraft({
        brief,
        answers: extraAnswers ?? answers,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (!res.ready) {
        setQuestions(res.questions);
        setDraft(null);
        return;
      }
      setQuestions([]);
      setDraft(res.draft);
      setImageUrl(res.imageUrl);
    });
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <Link href="/campaigns" className="text-sm text-muted-2 hover:underline">
        ← חזרה לקמפיינים
      </Link>
      <h1 className="mt-3 text-2xl font-bold text-foreground">
        בניית קמפיין עם ג׳וני
      </h1>
      <p className="mt-1 text-muted">
        ספרו לי במילים שלכם מה תרצו לפרסם — ואני אבנה קמפיין מוכן.
      </p>

      <div className="mt-6 max-w-2xl space-y-4">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          rows={3}
          placeholder="למשל: תבנה לי קמפיין לחולצות החדשות שעיצבתי, תקציב 50 ש״ח ביום, להפנות לאתר shop.example.com"
          className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <Button onClick={() => run()} disabled={pending || !brief.trim()}>
          {pending ? "ג׳וני עובד…" : "בנה לי קמפיין"}
        </Button>
        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {/* Clarifying questions */}
      {questions.length > 0 && (
        <div className="mt-6 max-w-2xl rounded-2xl border border-border bg-surface p-5">
          <p className="font-medium text-foreground">כמה שאלות קצרות:</p>
          <ul className="mt-2 space-y-1 text-sm text-muted">
            {questions.map((q) => (
              <li key={q}>• {q}</li>
            ))}
          </ul>
          <textarea
            value={answers}
            onChange={(e) => setAnswers(e.target.value)}
            rows={3}
            placeholder="כתבו כאן את התשובות…"
            className="mt-3 w-full rounded-lg border border-border bg-surface-2 px-3 py-2 text-sm text-foreground focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <div className="mt-2">
            <Button
              onClick={() => run()}
              disabled={pending || !answers.trim()}
              size="sm"
            >
              המשך
            </Button>
          </div>
        </div>
      )}

      {/* Draft preview */}
      {draft && (
        <div className="mt-6 max-w-2xl rounded-2xl border border-border bg-surface p-5">
          <p className="text-sm font-medium text-muted-2">תצוגה מקדימה</p>

          <div className="mt-3 overflow-hidden rounded-xl border border-border">
            {imageUrl ? (
              <div className="relative h-56 w-full bg-surface-2">
                <Image
                  src={imageUrl}
                  alt="campaign creative"
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-56 items-center justify-center bg-surface-2 text-muted-2">
                לא נוצרה תמונה
              </div>
            )}
            <div className="p-4">
              <p className="text-foreground">{draft.primaryText}</p>
              <p className="mt-2 font-bold text-foreground">{draft.headline}</p>
              <p className="text-sm text-muted">{draft.description}</p>
              <span className="mt-3 inline-block rounded-md bg-surface-2 px-3 py-1 text-sm text-foreground">
                {CTA_LABEL[draft.callToAction] ?? draft.callToAction}
              </span>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <Info label="תקציב יומי" value={ils.format(draft.dailyBudgetIls)} />
            <Info label="מטרה" value={draft.objective} />
            <Info
              label="קהל"
              value={`גילאי ${draft.audience.ageMin}-${draft.audience.ageMax} · ${draft.audience.countries.join(", ")}`}
            />
            <Info label="תחומי עניין" value={draft.audience.interests} />
          </dl>

          <div className="mt-5 flex gap-2">
            <Button disabled title="שלב הפרסום ל‑Meta ייכנס בקרוב">
              פרסום ל‑Meta (בקרוב)
            </Button>
            <Button variant="ghost" onClick={() => run()} disabled={pending}>
              צור גרסה אחרת
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface-2 p-3">
      <dt className="text-xs text-muted-2">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}
