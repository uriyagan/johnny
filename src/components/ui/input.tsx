import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm text-foreground placeholder:text-muted-2 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";
