import { cn } from "@/lib/cn";

/**
 * The ring-and-diamond mark as an illustration: the ring draws itself in, the
 * diamond breathes, a dot orbits slowly and faint concentric rings ripple out.
 * CSS only; motion stops under prefers-reduced-motion.
 */
export function AnimatedMark({ className, size = 120 }: { className?: string; size?: number }) {
  return (
    <span className={cn("amark relative inline-flex items-center justify-center", className)} style={{ width: size, height: size }} aria-hidden="true">
      <span className="amark-ripple" />
      <span className="amark-ripple [animation-delay:1.6s]" />
      <svg viewBox="0 0 48 48" fill="none" className="relative size-full overflow-visible">
        <circle cx="24" cy="24" r="22" className="stroke-white/[0.06]" strokeWidth="0.5" />
        <circle cx="24" cy="24" r="15.5" className="stroke-white/[0.04]" strokeWidth="0.5" />
        <path d="M29.66 18.34A8 8 0 1 0 29.66 29.66" stroke="currentColor" strokeWidth="2.5" pathLength={1} className="amark-ring" />
        <path d="M24 21.25 26.75 24 24 26.75 21.25 24Z" fill="currentColor" className="amark-diamond" />
        <g className="amark-orbit">
          <circle cx="24" cy="2" r="1" className="fill-[var(--color-action)]" />
        </g>
      </svg>
    </span>
  );
}
