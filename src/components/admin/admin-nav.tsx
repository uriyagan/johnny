"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS = [
  { href: "/admin", label: "סקירה" },
  { href: "/admin/tenants", label: "לקוחות" },
  { href: "/admin/subscriptions", label: "מנויים" },
  { href: "/admin/kill-switches", label: "מתגי חירום" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex gap-1">
      {ITEMS.map((item) => {
        const active =
          item.href === "/admin"
            ? pathname === "/admin"
            : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-gray-900 text-white"
                : "text-gray-600 hover:bg-gray-200",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
