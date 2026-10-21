import { Crown } from "lucide-react";
import { cn } from "@/lib/cn";
import { tierFor } from "@/lib/ranking/xp";

const TIER_STYLE: Record<string, string> = {
  Hatchling: "text-body ring-line",
  Apprentice: "text-success ring-success/30",
  Artisan: "text-ink ring-muted",
  Guildmaster: "text-warning ring-warning/40",
  Legend: "text-signal ring-signal/50",
};

export function TierBadge({ tier, className }: { tier: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label font-medium ring-1",
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
  const box = size === "lg" ? "size-16 text-lead font-semibold" : "size-9 text-base";
  if (url) return <img src={url} alt="" className={cn(box, "shrink-0 rounded-full object-cover ring-1 ring-line")} />;
  return (
    <span
      className={cn(box, "flex shrink-0 items-center justify-center rounded-full bg-secondary font-medium text-ink ring-1 ring-line")}
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
      <div className="h-px flex-1 overflow-hidden bg-line-strong">
        <div className="h-full bg-signal transition-[width] duration-1000" style={{ width: `${Math.round(progress * 100)}%` }} />
      </div>
      <span className="font-medium text-label tabular-nums text-muted">{next ? `${next.min - xp} to ${next.name}` : "Max tier"}</span>
    </div>
  );
}

/** Rank badge: metallic medals for the top three, a quiet chip for everyone else. */
export function RankMedal({ rank, size = "md" }: { rank: number; size?: "md" | "lg" }) {
  const box = size === "lg" ? "size-9 text-base" : "size-7 text-label";
  const tone = rank === 1 ? "medal-1" : rank === 2 ? "medal-2" : rank === 3 ? "medal-3" : "medal-n";
  return (
    <span className={cn("medal shrink-0", box, tone)} aria-label={`Rank ${rank}`}>
      {rank}
    </span>
  );
}
