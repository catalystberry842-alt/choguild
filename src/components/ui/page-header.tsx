import type { ReactNode } from "react";

/** The one header every inner page uses: optional eyebrow, title, one-line lead, actions. */
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
    <header className="flex flex-col gap-3">
      {eyebrow ? <p className="t-eyebrow">{eyebrow}</p> : null}
      <h1 className="t-title">{title}</h1>
      {description ? <p className="t-lead max-w-xl">{description}</p> : null}
      {children}
      {actions ? <div className="mt-3 flex flex-wrap items-center gap-3">{actions}</div> : null}
    </header>
  );
}
