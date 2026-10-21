import type { ReactNode } from "react";

/** Left-aligned page header: kicker, title, lead; actions sit right on desktop. Closed by a hairline. */
export function PageHeader({
  eyebrow,
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
    <header className="relative mb-10 border-b border-line pb-10 sm:mb-12">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div className="min-w-0 max-w-3xl">
          {eyebrow ? <p className="t-kicker mb-4">{eyebrow}</p> : null}
          <h1 className="t-title text-balance">{title}</h1>
          {description ? <p className="t-lead mt-4 max-w-xl text-pretty">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 flex-wrap gap-2.5">{actions}</div> : null}
      </div>
      {children}
    </header>
  );
}
