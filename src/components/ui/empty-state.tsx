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
    <Reveal className={"flex flex-col gap-6 border-y border-dashed border-line-strong sm:flex-row sm:items-center " + (compact ? "py-8" : "py-14")}>
      <AnimatedMark size={compact ? 44 : 64} className="shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <h3 className="t-display text-[1.6rem] leading-tight">{title}</h3>
        {body ? <p className="t-body mt-2 max-w-md">{body}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2.5">{action}</div> : null}
    </Reveal>
  );
}
