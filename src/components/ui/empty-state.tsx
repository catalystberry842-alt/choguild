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
    <div className="rounded-2xl border border-dashed border-line bg-sidebar px-5 py-8">
      <h3 className="text-base font-medium text-ink">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-body">{body}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
