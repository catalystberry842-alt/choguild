import type { ReactNode } from "react";

/** A titled block rendered as a rounded card: title and context on top, content below. */
export function Section({
  title,
  description,
  action,
  children,
  id,
  className = "",
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  return (
    <section id={id} className={"grid scroll-mt-24 gap-6 border-t border-line pt-8 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12 " + className}>
      <div className="max-w-xl">
        <h2 className="t-h2">{title}</h2>
        {description ? <p className="t-meta mt-2">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}
