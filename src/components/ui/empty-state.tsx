import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line bg-sidebar px-6 py-10 sm:px-8">
      <h3 className="text-base font-medium text-ink">{title}</h3>
      <p className="mt-3 max-w-xl text-sm leading-6 text-body">{body}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
