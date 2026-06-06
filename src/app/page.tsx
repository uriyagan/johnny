/**
 * M0 scaffold landing page — a quick visual sanity check that RTL + Hebrew
 * font + Tailwind are wired correctly. Replaced by the real chat-first home
 * in Milestone 2.
 */
export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-start justify-center gap-6 px-6">
      <span className="rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-700">
        ✓ M0 — השלד עובד
      </span>
      <h1 className="text-4xl font-bold">Johnny</h1>
      <p className="text-lg text-gray-600">
        מנהל הקמפיינים האוטומטי שלך — ממשק בעברית, מימין לשמאל.
      </p>
      <p className="ms-0 border-s-4 border-emerald-400 ps-4 text-sm text-gray-500">
        אם הטקסט מיושר לימין והפס הירוק מופיע בצד ימין — RTL מוגדר נכון.
      </p>
    </main>
  );
}
