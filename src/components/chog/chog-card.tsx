import { Flame } from "lucide-react";
import { chogImageUrl } from "@/lib/chog/chog";
import { cn } from "@/lib/cn";
import { formatXp, tierFor } from "@/lib/ranking/xp";

export const TIER_TITLE: Record<string, string> = {
  Hatchling: "Hatchling Chog",
  Apprentice: "Apprentice of the Guild",
  Artisan: "Artisan Chog",
  Guildmaster: "Guildmaster",
  Legend: "Legendary Chog",
};

/** The Chog's member card: real token art, tier frame/title/glow, rank and XP. */
export function ChogCard({
  chogId,
  name,
  xp,
  rank,
  streak,
  className,
  size = "md",
}: {
  chogId: number;
  name?: string | null;
  xp: number;
  rank?: number | null;
  streak?: number;
  className?: string;
  size?: "sm" | "md";
}) {
  const { tier, next, progress } = tierFor(xp);
  return (
    <div data-tier={tier.name} className={cn("chog-card p-3", size === "md" ? "w-full max-w-[18rem]" : "w-full max-w-[13rem]", className)}>
      <img
        src={chogImageUrl(chogId)}
        alt={`Chog Genesis #${chogId}`}
        width={480}
        height={480}
        className="chog-art aspect-square w-full bg-secondary object-cover"
      />
      <div className="px-1 pt-3">
        <p className="tier-title">{TIER_TITLE[tier.name] ?? tier.name}</p>
        <div className="mt-1 flex items-baseline justify-between gap-2">
          <p className="truncate text-base font-semibold text-ink">{name || `Chog #${chogId}`}</p>
          <p className="shrink-0 text-small tabular-nums text-muted">#{chogId}</p>
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-small tabular-nums">
          <span className="text-ink">{formatXp(xp)} XP</span>
          <span className="flex items-center gap-2 text-muted">
            {streak ? (
              <span className="inline-flex items-center gap-0.5" title={`${streak}-day streak`}>
                <Flame className="size-3.5 text-[#836ef9]" aria-hidden="true" />
                {streak}
              </span>
            ) : null}
            {rank ? <span>Rank {rank}</span> : null}
          </span>
        </div>
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-line-strong" title={next ? `${next.min - xp} XP to ${next.name}` : "Max tier"}>
          <div className="h-full rounded-full bg-[#836ef9]" style={{ width: `${Math.round(progress * 100)}%` }} />
        </div>
        <p className="mt-1.5 text-label text-muted">{next ? `${formatXp(next.min - xp)} XP to ${next.name}` : "Max tier reached"}</p>
      </div>
    </div>
  );
}
