import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Grouped glass block for long forms: title, optional hint, fields. */
export function FormSection({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface rounded-[1.5rem] p-6 sm:p-7", className)}>
      <header className="mb-5">
        <h2 className="t-h3 text-ink">{title}</h2>
        {description ? <p className="t-meta mt-1.5 max-w-xl">{description}</p> : null}
      </header>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}
