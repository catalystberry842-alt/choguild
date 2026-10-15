import type { ReactNode } from "react";
import { AnimatedMark } from "@/components/brand/animated-mark";
import { Reveal } from "@/components/fx/reveal";

/** Empty states: the animated mark, a short title, one line of context and one action. */
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
    <Reveal className="surface relative overflow-hidden px-6 text-center sm:px-10">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(130_120_230/0.14),transparent)]"
        aria-hidden="true"
      />
      <div className={compact ? "relative flex flex-col items-center py-9" : "relative flex flex-col items-center py-14"}>
        <AnimatedMark size={compact ? 72 : 104} className="text-ink" />
        <h3 className="mt-5 text-[17px] font-semibold tracking-[-0.02em] text-ink">{title}</h3>
        {body ? <p className="t-body mx-auto mt-2 max-w-sm">{body}</p> : null}
        {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
      </div>
    </Reveal>
  );
}
