import { Link, createFileRoute } from "@tanstack/react-router";
import { Flame } from "lucide-react";
import { TierBadge, XpBar } from "@/components/ranking/bits";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { getRanking } from "@/lib/ranking/functions";
import { RANK_BY, formatXp, rankContributors, totalXp, type RankBy } from "@/lib/ranking/xp";
import { seo } from "@/lib/seo";
import { ChogImage } from "@/components/chog/chog-bits";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";
import { usePassport } from "@/components/passport/passport-provider";

export const Route = createFileRoute("/ranking")({
  validateSearch: (search: Record<string, unknown>): { by?: RankBy } => (search.by === "season" ? { by: "season" } : {}),
  loader: () => getRanking(),
  staticData: { title: "Leaderboard", crumb: "Leaderboard" },
  pendingComponent: () => <LoadingState label="Loading page" layout="ladder" />,
  head: () => seo({ title: "Chog leaderboard · Choguild", description: "Chog Genesis NFTs ranked by accepted guild work and daily quests, all time and this week's season.", path: "/ranking" }),
  component: RankingPage,
});

function seasonLeft(end: number): string {
  const ms = end - Date.now();
  if (ms <= 0) return "ending now";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
}

function RankingPage() {
  const { contributors, stats, season, prize } = Route.useLoaderData();
  const by: RankBy = Route.useSearch().by ?? "overall";
  const { chogId: mine } = usePassport();
  const ranking = rankContributors(contributors, by).filter((p) => by !== "season" || p.xp > 0);
  const BLURB: Record<RankBy, string> = {
    overall: "All-time XP from accepted work, listings, daily quests and duels.",
    season: `Season ${season.number} · resets Monday 00:00 UTC · ${seasonLeft(season.end)}.`,
  };

  return (
    <div className="flex flex-col">
      <PageHeader title={<>The Chog <em>leaderboard.</em></>} description="Every row is a Chog Genesis NFT. Its rank lives on the token and moves with it.">
        <dl className="mt-6 grid grid-cols-3 gap-y-4 border-t border-line pt-4 sm:max-w-xl">
          {([["Chogs ranked", stats.passports], ["Accepted work", stats.acceptedWork], ["Quests today", stats.questsToday]] as const).map(([label, value]) => (
            <div key={label} className="border-l border-line pl-4 first:border-l-0 first:pl-0">
              <dt className="t-kicker">{label}</dt>
              <dd className="t-stat-num mt-1 text-ink">{value.toLocaleString("en-US")}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      {by === "season" && prize ? (
        <p className="surface mb-4 flex items-center gap-2 px-4 py-3 text-small text-ink">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-[#836ef9]" />
          <span><span className="font-semibold">Season {season.number} prize:</span> {prize}</span>
        </p>
      ) : null}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Rank by" className="inline-flex self-start rounded-full border border-line p-1">
          {RANK_BY.map((option) => {
            const active = option.id === by;
            return (
              <Link
                key={option.id}
                role="tab"
                aria-selected={active}
                to="/ranking"
                search={option.id === "overall" ? {} : { by: option.id }}
                replace
                className={cn("rounded-full px-3.5 py-1 text-small transition-colors", active ? "bg-ink text-canvas" : "text-body hover:text-ink")}
              >
                {option.label === "This season" ? `Season ${season.number}` : option.label}
              </Link>
            );
          })}
        </div>
        <p className="t-meta">
          {BLURB[by]}{" "}
          <Link to="/how-it-works" hash="xp" className="t-link">How XP works</Link>
        </p>
      </div>

      {ranking.length === 0 ? (
        <EmptyLadder season={by === "season"} />
      ) : (
        <section aria-label="Leaderboard" className="surface overflow-hidden">
          <div className="hidden grid-cols-[3rem_minmax(0,1fr)_8rem_5rem_6rem_8rem] gap-5 border-b border-line px-5 py-2.5 md:grid" aria-hidden="true">
            <span className="t-kicker">Rank</span>
            <span className="t-kicker">Chog</span>
            <span className="t-kicker">Tier</span>
            <span className="t-kicker text-right">Streak</span>
            <span className="t-kicker text-right">{by === "season" ? "All time" : "Season"}</span>
            <span className="t-kicker text-right">XP</span>
          </div>
          <ol className="divide-y divide-line">
            {ranking.map((person) => (
              <li key={person.chogId}>
                <Link
                  to="/chog/$chogId"
                  params={{ chogId: String(person.chogId) }}
                  className={cn(
                    "group grid grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-line/50 sm:px-5 md:grid-cols-[3rem_minmax(0,1fr)_8rem_5rem_6rem_8rem] md:gap-5",
                    person.chogId === mine && "bg-[#836ef9]/10",
                  )}
                >
                  <span className={cn("tabular-nums", person.rank <= 3 ? "text-lead font-semibold text-ink" : "text-base text-muted")}>{person.rank}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    <ChogImage tokenId={person.chogId} size="sm" className={cn("rounded-xl", person.rank === 1 && "ring-2 ring-[#836ef9]")} />
                    <span className="min-w-0">
                      <span className="block truncate text-base font-medium text-ink">{person.displayName}</span>
                      <span className="block truncate text-small text-muted">
                        Chog #{person.chogId}
                        {person.chogId === mine ? " · you" : ""}
                        <span className="md:hidden"> · {person.tier}{person.streak ? ` · ${person.streak}d streak` : ""}</span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden md:block"><TierBadge tier={person.tier} /></span>
                  <span className="hidden items-center justify-end gap-1 text-small tabular-nums text-body md:flex">
                    {person.streak ? <><Flame className="size-3.5 text-[#836ef9]" aria-hidden="true" />{person.streak}</> : "—"}
                  </span>
                  <span className="hidden text-right text-small tabular-nums text-body md:block">{formatXp(by === "season" ? totalXp(person) : person.seasonXp)}</span>
                  <span className="text-right">
                    <span className="text-base font-semibold tabular-nums text-ink">{formatXp(person.xp)}</span>
                    {by === "overall" ? <span className="mt-1.5 hidden md:block"><XpBar xp={person.xp} compact /></span> : null}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}

function EmptyLadder({ season }: { season: boolean }) {
  return (
    <EmptyState
      title={season ? "Nobody has scored this season yet" : "No Chog is ranked yet"}
      body={season ? "Check in with your Chog or get work accepted to take the top spot this week." : "Act as your Chog, save its passport and check in to put it on the board."}
      action={
        <>
          <Button asChild size="compact"><Link to="/passport">Act as your Chog</Link></Button>
          <Button asChild size="compact" variant="secondary"><Link to="/how-it-works">How it works</Link></Button>
        </>
      }
    />
  );
}
