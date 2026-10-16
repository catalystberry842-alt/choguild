import type { ReactNode } from "react";
import { AnimatedMark } from "@/components/brand/animated-mark";

/** Empty states: left-aligned, ruled, with the mark, a title, context and one action. */
export function EmptyState({
  title,
  body,
  action,
  compact = false,
  level = 2,
}: {
  title: string;
  body?: string;
  action?: ReactNode;
  compact?: boolean;
  /** Heading level, so the outline never skips (h1 → h2 → h3). */
  level?: 2 | 3;
}) {
  const Heading = level === 3 ? "h3" : "h2";
  return (
    <div className={"fade-in flex flex-col gap-6 px-6 sm:flex-row sm:items-center sm:px-8 " + (compact ? "rounded-2xl border border-dashed border-line-strong py-6" : "bento py-12")}>
      <AnimatedMark size={compact ? 44 : 64} className="shrink-0 text-ink" />
      <div className="min-w-0 flex-1">
        <Heading className="t-h3 text-ink">{title}</Heading>
        {body ? <p className="t-body mt-2 max-w-md">{body}</p> : null}
      </div>
      {action ? <div className="flex flex-wrap gap-2.5">{action}</div> : null}
    </div>
  );
}
