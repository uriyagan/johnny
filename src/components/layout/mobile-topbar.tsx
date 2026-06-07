"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconMenu2, IconX } from "@tabler/icons-react";
import { cn } from "@/lib/utils";
import { signOut } from "@/lib/actions/auth";
import { NAV_ITEMS } from "./nav-items";
import { Button } from "@/components/ui/button";

export function MobileTopbar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
        <span className="text-xl font-bold text-emerald-500">Johnny</span>
        <button
          type="button"
          aria-label="תפריט"
          onClick={() => setOpen(true)}
          className="rounded-lg p-2 text-foreground hover:bg-white/10"
        >
          <IconMenu2 className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="flex-1 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <aside className="flex h-full w-72 flex-col bg-surface p-4">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xl font-bold text-emerald-500">Johnny</span>
              <button
                type="button"
                aria-label="סגירה"
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-foreground hover:bg-white/10"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 overflow-y-auto">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                      active
                        ? "bg-emerald-500/10 text-emerald-300"
                        : "text-muted hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="border-t border-border pt-3">
              <p className="truncate px-2 text-sm font-medium text-foreground">
                {displayName}
              </p>
              <p className="truncate px-2 text-xs text-muted-2" dir="ltr">
                {email}
              </p>
              <form action={signOut} className="mt-2">
                <Button type="submit" variant="ghost" size="sm" className="w-full">
                  התנתקות
                </Button>
              </form>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
