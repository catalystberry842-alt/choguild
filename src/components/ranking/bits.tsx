import { Crown } from "lucide-react";
import { cn } from "@/lib/cn";
import { tierFor } from "@/lib/ranking/xp";

const TIER_STYLE: Record<string, string> = {
  Hatchling: "text-body ring-line",
  Apprentice: "text-success ring-success/30",
  Artisan: "text-ink ring-muted",
  Guildmaster: "text-warning ring-warning/40",
  Legend: "text-ink ring-ink/60",
};

export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-elevated px-2 py-0.5 text-[11px] font-semibold ring-1",
        TIER_STYLE[tier] ?? TIER_STYLE.Hatchling,
        className,
      )}
    >
      {tier === "Legend" ? <Crown className="size-3" aria-hidden="true" /> : null}
      {tier}
    </span>
  );
}

export function Avatar({ name, url, size = "md" }: { name: string; url: string | null; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-16 text-xl" : "size-9 text-sm";
  if (url) return <img src={url} alt="" className={cn(box, "shrink-0 rounded-full object-cover ring-1 ring-line")} />;
  return (
    <span
      className={cn(box, "flex shrink-0 items-center justify-center rounded-full bg-secondary font-bold text-ink ring-1 ring-line")}
      aria-hidden="true"
    >
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

export function XpBar({ xp }: { xp: number }) {
  const { next, progress } = tierFor(xp);
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
        <div className="h-full rounded-full bg-action transition-[width] duration-700" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <span className="text-[11px] tabular-nums text-muted">{next ? `${next.min - xp} to ${next.name}` : "Max tier"}</span>
    </div>
  );
}
