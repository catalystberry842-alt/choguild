import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";
import type { Tone } from "@/lib/status-tone";

const tones: Record<Tone, string> = {
  neutral: "bg-secondary text-body ring-line",
  info: "bg-action/10 text-ink ring-action/30",
  success: "bg-success/10 text-success ring-success/25",
  warning: "bg-warning/10 text-warning ring-warning/25",
  danger: "bg-danger/10 text-danger ring-danger/25",
};

export function Badge({ tone = "neutral", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] leading-4 font-medium whitespace-nowrap ring-1",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
