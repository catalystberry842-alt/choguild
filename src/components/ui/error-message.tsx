import type { ReactNode } from "react";

export function ErrorMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div role="alert" className="rounded-md border border-line bg-elevated px-4 py-3">
      <p className="text-base font-medium text-danger">{title}</p>
      <div className="mt-1 text-base text-body">{children}</div>
    </div>
  );
}
