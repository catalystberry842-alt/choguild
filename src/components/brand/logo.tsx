import { cn } from "@/lib/cn";

/** The Choguild mark: an open ring (the guild) around a diamond (the work). Single colour via currentColor. */
export function LogoMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={cn("size-6 shrink-0", className)}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      <path d="M17.66 6.34A8 8 0 1 0 17.66 17.66" stroke="currentColor" strokeWidth="2.5" pathLength={1} className="logo-ring" />
      <path d="M12 9.25 14.75 12 12 14.75 9.25 12Z" fill="currentColor" className="logo-diamond" />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("logo-anim flex items-center gap-2 text-ink", className)}>
      <LogoMark className="size-[22px]" />
      <span className="text-[15px] font-semibold tracking-[-0.02em]">Choguild</span>
    </span>
  );
}
