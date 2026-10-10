import type { ReactNode } from "react";

export function SectionHeader({
  title,
  action,
  children,
}: {
  title: string;
  action?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <h2 className="text-xl leading-tight font-bold text-ink">{title}</h2>
        {action}
      </div>
      {children ? <p className="mt-1 max-w-2xl text-sm leading-5 text-body">{children}</p> : null}
    </div>
  );
}
