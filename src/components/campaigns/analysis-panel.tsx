"use client";

import { useState, useTransition } from "react";
import { analyzeMyCampaigns } from "@/lib/actions/analyze-campaigns";
import type { CampaignAnalysis } from "@/lib/ai/types";
import { Button } from "@/components/ui/button";

export function AnalysisPanel() {
  const [analysis, setAnalysis] = useState<CampaignAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function run() {
    setError(null);
    start(async () => {
      const res = await analyzeMyCampaigns();
      if (res.ok) setAnalysis(res.analysis);
      else setError(res.error);
    });
  }

  return (
    <div className="mt-6 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold text-foreground">ניתוח חכם של הקמפיינים</h2>
          <p className="mt-1 text-sm text-muted-2">
            ג׳וני יעבור על הקמפיינים שלך ויסביר מה עובד ומה כדאי לשפר.
          </p>
        </div>
        <Button onClick={run} disabled={pending} size="sm">
          {pending ? "ג׳וני בודק…" : "נתח את הקמפיינים שלי"}
        </Button>
      </div>

      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

      {analysis && (
        <div className="mt-4 space-y-4">
          <p className="text-foreground">{analysis.summary}</p>

          {analysis.insights.length > 0 && (
            <div>
              <p className="text-sm font-medium text-muted-2">מה שמתבלט:</p>
              <ul className="mt-1 space-y-1 text-sm text-muted">
                {analysis.insights.map((i) => (
                  <li key={i}>• {i}</li>
                ))}
              </ul>
            </div>
          )}

          {analysis.recommendations.length > 0 && (
            <div className="rounded-xl bg-emerald-500/10 p-3">
              <p className="text-sm font-medium text-emerald-200">המלצות לפעולה:</p>
              <ul className="mt-1 space-y-1 text-sm text-emerald-100">
                {analysis.recommendations.map((r) => (
                  <li key={r}>• {r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
