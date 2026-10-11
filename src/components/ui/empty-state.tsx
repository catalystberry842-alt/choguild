import type { ReactNode } from "react";

export function EmptyState({
  title,
  body,
  action,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-dashed border-line px-6 py-10 text-center sm:px-8">
      <h3 className="t-h3">{title}</h3>
      {body ? <p className="t-body mx-auto mt-2 max-w-md">{body}</p> : null}
      {action ? <div className="mt-6 flex justify-center">{action}</div> : null}
    </div>
  );
}
