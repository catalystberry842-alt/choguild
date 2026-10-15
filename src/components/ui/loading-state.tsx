/**
 * Skeletons shaped like the page that is loading, so content lands in place
 * instead of jumping. `layout` picks the shape.
 */
type Layout = "page" | "cards" | "ladder" | "detail" | "list";

function Header() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center pb-12">
      <div className="skeleton mb-6 h-6 w-24 rounded-full" />
      <div className="skeleton h-10 w-80 max-w-full sm:h-12" />
      <div className="skeleton mt-5 h-5 w-96 max-w-full" />
    </div>
  );
}

function Cards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="bento flex h-56 flex-col gap-4 p-6" style={{ opacity: 1 - i * 0.15 }}>
          <div className="flex items-center justify-between">
            <div className="skeleton h-4 w-28" />
            <div className="skeleton h-5 w-14 rounded-full" />
          </div>
          <div className="skeleton h-6 w-3/4" />
          <div className="skeleton h-4 w-full" />
          <div className="mt-auto flex gap-2">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-6 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

function Ladder() {
  return (
    <>
      <div className="mx-auto mb-10 h-9 w-72 max-w-full skeleton rounded-full" />
      <div className="grid grid-cols-3 items-end gap-3">
        {[40, 52, 36].map((h, i) => (
          <div key={i} className="bento flex flex-col items-center gap-3 p-6" style={{ height: `${h * 4}px` }}>
            <div className="skeleton size-12 rounded-full" />
            <div className="skeleton h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="mt-6 flex flex-col gap-2">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="skeleton h-14 w-full rounded-2xl" style={{ opacity: 1 - i * 0.2 }} />
        ))}
      </div>
    </>
  );
}

function Detail() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="skeleton h-4 w-32" />
      <div className="skeleton mt-6 h-10 w-4/5" />
      <div className="skeleton mt-8 h-5 w-full" />
      <div className="skeleton mt-3 h-5 w-11/12" />
      <div className="bento mt-10 flex h-48 flex-col gap-3 p-6">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-5/6" />
      </div>
    </div>
  );
}

function List({ rows = 4 }: { rows?: number }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="skeleton h-16 w-full rounded-2xl" style={{ opacity: 1 - i * 0.2 }} />
      ))}
    </div>
  );
}

export function LoadingState({ label = "Loading", layout = "page", rows = 3 }: { label?: string; layout?: Layout; rows?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{label}</span>
      {layout === "detail" ? (
        <Detail />
      ) : layout === "list" ? (
        <List rows={rows} />
      ) : (
        <>
          <Header />
          {layout === "cards" ? (
            <>
              <div className="skeleton mx-auto mb-12 h-12 w-full max-w-3xl rounded-full" />
              <Cards />
            </>
          ) : layout === "ladder" ? (
            <Ladder />
          ) : (
            <Cards count={2} />
          )}
        </>
      )}
    </div>
  );
}
