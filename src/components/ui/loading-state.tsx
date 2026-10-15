export function LoadingState({ label = "Loading" }: { label?: string }) {
  return (
    <div role="status" className="flex items-center gap-3 py-6 text-sm text-body">
      <span className="size-4 animate-spin rounded-full border-2 border-line border-t-ink motion-reduce:animate-none" aria-hidden="true" />
      {label}
    </div>
  );
}

/** Placeholder in the shape of a page (header, then cards) while a route loads. */
export function PageSkeleton() {
  const block = "rounded-full bg-secondary motion-safe:animate-pulse";
  return (
    <div role="status" aria-label="Loading page" className="flex flex-col gap-10">
      <div className="flex flex-col gap-4">
        <span className={`h-9 w-56 ${block}`} />
        <span className={`h-4 w-80 max-w-full ${block}`} />
      </div>
      <div className="flex flex-col gap-4">
        {[0, 1, 2].map((index) => (
          <div key={index} className="surface flex items-center gap-4 p-6">
            <span className="size-10 shrink-0 rounded-xl bg-secondary motion-safe:animate-pulse" />
            <div className="flex flex-1 flex-col gap-2.5">
              <span className={`h-3 w-2/3 ${block}`} />
              <span className={`h-3 w-1/3 ${block}`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
