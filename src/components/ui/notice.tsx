import type { ReactNode } from "react";

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line bg-elevated px-4 py-3">
      <p className="text-sm font-medium text-ink">{title}</p>
      <div className="mt-1 text-sm leading-relaxed text-body">{children}</div>
    </div>
  );
}
