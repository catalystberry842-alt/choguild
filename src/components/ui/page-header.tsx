import type { ReactNode } from "react";

/** Centred page header: a small pill label, a sans title, a lead and actions. */
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
    <header className="relative mx-auto flex max-w-3xl flex-col items-center pb-12 text-center">
      {eyebrow ? (
        <p
          className="fade-in-soft mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-elevated/70 px-3 py-1 text-label text-body"
        >
          <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
          {eyebrow}
        </p>
      ) : null}
      <h1 className="t-title text-balance">{title}</h1>
      {description ? (
        <p
          className="fade-in-soft t-lead mt-5 max-w-xl text-balance"
        >
          {description}
        </p>
      ) : null}
      {children}
      {actions ? (
        <div className="fade-in-soft mt-7 flex flex-wrap justify-center gap-2.5">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
