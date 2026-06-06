import type { ReactNode } from "react";
import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ClientLayout({
  children,
}: {
  children: ReactNode;
}) {
  const user = await requireUser();

  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", user.id)
    .single();

  const displayName =
    profile?.business_name || profile?.full_name || user.email || "משתמש";

  return (
    <div className="flex min-h-screen">
      <Sidebar displayName={displayName} email={user.email ?? ""} />
      <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
    </div>
  );
}
