import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { NAV_ITEMS } from "./nav-items";
import { NavLink } from "./nav-link";

export function Sidebar({
  displayName,
  email,
}: {
  displayName: string;
  email: string;
}) {
  return (
    <aside className="hidden w-64 shrink-0 flex-col border-s border-border bg-surface md:flex">
      <div className="px-5 py-6">
        <span className="text-2xl font-bold text-emerald-400">Johnny</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      <div className="border-t border-border p-3">
        <div className="mb-2 px-2">
          <p className="truncate text-sm font-medium text-foreground">
            {displayName}
          </p>
          <p className="truncate text-xs text-muted-2" dir="ltr">
            {email}
          </p>
        </div>
        <form action={signOut}>
          <Button type="submit" variant="ghost" size="sm" className="w-full">
            התנתקות
          </Button>
        </form>
      </div>
    </aside>
  );
}
