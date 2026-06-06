export function ComingSoon({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex-1 overflow-y-auto p-8">
      <h1 className="text-2xl font-bold text-foreground">{title}</h1>
      <p className="mt-1 text-muted">{description}</p>
      <div className="mt-8 rounded-2xl border border-dashed border-border bg-surface p-12 text-center text-muted-2">
        בקרוב ✨
      </div>
    </div>
  );
}
