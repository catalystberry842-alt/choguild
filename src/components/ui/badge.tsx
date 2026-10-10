import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "bg-secondary text-body ring-1 ring-line",
  sand: "bg-action/15 text-sand ring-1 ring-action/30",
  olive: "bg-success/10 text-success ring-1 ring-success/25",
  warning: "bg-warning/10 text-warning ring-1 ring-warning/25",
  danger: "bg-danger/10 text-danger ring-1 ring-danger/25",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: keyof typeof tones }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium leading-4",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
