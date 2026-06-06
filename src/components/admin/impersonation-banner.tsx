import { stopImpersonation } from "@/lib/actions/admin";

export function ImpersonationBanner({ email }: { email: string }) {
  return (
    <div className="flex items-center justify-center gap-3 bg-amber-500 px-4 py-2 text-sm text-white">
      <span>
        מצב התחזות — צופה כ‑<span className="font-medium">{email}</span>
      </span>
      <form action={stopImpersonation}>
        <button type="submit" className="rounded bg-white/20 px-2 py-0.5 font-medium hover:bg-white/30">
          יציאה
        </button>
      </form>
    </div>
  );
}
