export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="mt-1 text-gray-600">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-400">
        בקרוב ✨
      </div>
    </div>
  );
}
