import type { ReactNode } from "react";
import { Reveal } from "@/components/fx/reveal";

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
    <Reveal as="section" y={12}>
      <header className="flex flex-col gap-4">
        {eyebrow ? <p className="t-eyebrow">{eyebrow}</p> : null}
        <h1 className="t-title text-shine">{title}</h1>
        {description ? <p className="t-lead max-w-xl">{description}</p> : null}
        {children}
        {actions ? <div className="mt-3 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </header>
    </Reveal>
  );
}
