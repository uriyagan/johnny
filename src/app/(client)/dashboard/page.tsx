import { requireUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const user = await requireUser();
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, business_name")
    .eq("id", user.id)
    .single();

  const name = profile?.full_name?.split(" ")[0] || "ברוך הבא";

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">שלום, {name} 👋</h1>
      <p className="mt-1 text-gray-600">
        {profile?.business_name
          ? `נהל את הקמפיינים של ${profile.business_name} בקלות.`
          : "נהל את הקמפיינים שלך בקלות."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { label: "חשבונות מודעות", value: "0" },
          { label: "קמפיינים פעילים", value: "0" },
          { label: "הוצאה החודש", value: "₪0" },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-gray-200 bg-white p-5"
          >
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
