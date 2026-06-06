import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type BadgeTone = "green" | "gray" | "yellow" | "red";

const tones: Record<BadgeTone, string> = {
  green: "bg-emerald-500/10 text-emerald-300",
  gray: "bg-surface-2 text-muted",
  yellow: "bg-amber-500/10 text-amber-300",
  red: "bg-red-500/10 text-red-300",
};

export function Badge({
  tone = "gray",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
