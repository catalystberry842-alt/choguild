import type { HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

const tones = {
  neutral: "text-body ring-1 ring-line-strong",
  sand: "text-ink ring-1 ring-line-strong",
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
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-label font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
