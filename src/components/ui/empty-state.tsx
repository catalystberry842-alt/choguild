import type { ReactNode } from "react";
import { AnimatedMark } from "@/components/brand/animated-mark";
import { Reveal } from "@/components/fx/reveal";

/** Empty states: left-aligned, ruled, with the mark, a serif line, context and one action. */
export function EmptyState({
  title,
  body,
  action,
  compact = false,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <Reveal className={"flex flex-col gap-6 px-6 sm:flex-row sm:items-center sm:px-8 " + (compact ? "rounded-2xl border border-dashed border-line-strong py-6" : "bento py-12")}>
      <AnimatedMark size={compact ? 44 : 64} className="shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <h3 className="t-display text-[1.75rem] leading-tight text-ink">{title}</h3>
        {body ? <p className="t-body mt-2 max-w-md">{body}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2.5">{action}</div> : null}
    </Reveal>
  );
}
