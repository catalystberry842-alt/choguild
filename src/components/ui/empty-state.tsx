import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
  as: Heading = "h3",
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  /** Heading level. Use "h1" when the empty state is the whole page (not-found states). */
  as?: "h1" | "h2" | "h3";
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line px-6 py-10 text-center sm:px-8">
      <Heading className="t-h3">{title}</Heading>
      {body ? <p className="t-body mx-auto mt-2 max-w-md">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
