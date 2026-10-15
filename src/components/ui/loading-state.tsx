/** Skeleton placeholder: a title bar and a few shimmering rows. */
export function LoadingState({ label = "Loading", rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-3 py-2">
      <span className="sr-only">{label}</span>
      <div className="skeleton h-7 w-48" />
      <div className="skeleton h-4 w-72 max-w-full" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="skeleton h-20 w-full rounded-2xl" style={{ opacity: 1 - i * 0.22 }} />
        ))}
      </div>
    </div>
  );
}
