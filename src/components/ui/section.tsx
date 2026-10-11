import type { ReactNode } from "react";

/** A titled block within a page. Sections are separated by a hairline and generous space. */
export function Section({
  title,
  description,
  action,
  children,
  id,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="border-t border-line pt-12 first:border-t-0 first:pt-0 [header+&]:border-t-0 [header+&]:pt-0">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="t-h2">{title}</h2>
          {description ? <p className="t-body mt-1.5">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
