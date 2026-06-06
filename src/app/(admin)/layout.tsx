import type { ReactNode } from "react";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { signOut } from "@/lib/actions/auth";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-center gap-6">
            <span className="font-bold text-foreground">Johnny · ניהול</span>
            <AdminNav />
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-muted-2 hover:underline"
            >
              ← לאפליקציה
            </Link>
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                התנתקות
              </Button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
