import { cn } from "@/lib/cn";

/** The ring-and-diamond mark: the ring draws itself in and the diamond turns a quarter now and then. */
export function AnimatedMark({ className, size = 120 }: { className?: string; size?: number }) {
  return (
    <span className={cn("inline-flex items-center justify-center", className)} style={{ width: size, height: size }} aria-hidden="true">
      <svg viewBox="0 0 24 24" fill="none" className="size-full overflow-visible">
        <path d="M17.66 6.34A8 8 0 1 0 17.66 17.66" stroke="currentColor" strokeWidth="2" pathLength={1} className="amark-ring" />
        <path d="M12 9.25 14.75 12 12 14.75 9.25 12Z" className="amark-diamond fill-signal" />
      </svg>
    </span>
  );
}
