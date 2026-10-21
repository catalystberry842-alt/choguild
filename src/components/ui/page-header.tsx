import type { ReactNode } from "react";

/** Left-aligned page header: title, lead (eyebrow kept for API compatibility, not rendered); actions sit right on desktop. Closed by a hairline. */
export function PageHeader({
  eyebrow: _eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="stage rise relative mb-8 px-5 pt-8 pb-6 sm:mb-10 sm:px-8 sm:pt-10 sm:pb-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0 max-w-3xl">
          <h1 className="t-title text-balance text-ink">{title}</h1>
          {description ? <p className="t-lead mt-3 max-w-xl text-pretty">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
