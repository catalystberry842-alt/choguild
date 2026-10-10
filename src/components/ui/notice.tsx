import type { ReactNode } from "react";

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-line bg-elevated px-6 py-5">
      <p className="text-sm font-medium text-ink">{title}</p>
      <div className="mt-2 text-sm leading-6 text-body">{children}</div>
    </div>
  );
}
