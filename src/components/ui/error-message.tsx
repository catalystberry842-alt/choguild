import type { ReactNode } from "react";

export function ErrorMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3.5 shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]"
    >
      <p className="text-base font-medium text-danger">{title}</p>
      <div className="mt-1 text-base text-body">{children}</div>
    </div>
  );
}
