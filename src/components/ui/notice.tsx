import type { ReactNode } from "react";

export function Notice({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="surface px-6 py-5">
      <p className="t-h3">{title}</p>
      <div className="t-body mt-1.5">{children}</div>
    </div>
  );
}
