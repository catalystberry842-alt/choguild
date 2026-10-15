import type { ReactNode } from "react";
import { Reveal } from "@/components/fx/reveal";

/** A titled block rendered as a rounded card: serif title and context on top, content below. */
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
    <Reveal as="section" id={id} className={"bento scroll-mt-24 p-6 sm:p-8 " + className}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-xl">
          <h2 className="t-h2">{title}</h2>
          {description ? <p className="t-meta mt-2">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className="min-w-0">{children}</div>
    </Reveal>
  );
}
