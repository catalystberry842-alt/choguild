import type { ReactNode } from "react";

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
    <section id={id} className="border-t border-line py-12 first:border-t-0 first:pt-0 sm:py-14">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
          {description ? (
            <p className="mt-2 text-[15px] leading-7 text-body">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
