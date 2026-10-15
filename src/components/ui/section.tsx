import type { ReactNode } from "react";
import { Reveal } from "@/components/fx/reveal";

/** A titled block: the label sits in a narrow left column on wide screens, content on the right. */
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
    <Reveal as="section" id={id} className="grid gap-6 border-t border-line pt-8 lg:grid-cols-12 lg:gap-8">
      <div className="lg:col-span-3">
        <h2 className="t-h3">{title}</h2>
        {description ? <p className="t-meta mt-2 max-w-xs">{description}</p> : null}
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
      <div className="min-w-0 lg:col-span-9">{children}</div>
    </Reveal>
  );
}
