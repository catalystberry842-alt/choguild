import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { Avatar, TierBadge, XpBar } from "@/components/ranking/bits";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { getRanking } from "@/lib/ranking/functions";
import {
  ONCHAIN_XP_CAP,
  RANK_BY,
  formatXp,
  rankContributors,
  type RankBy,
} from "@/lib/ranking/xp";
import { seo } from "@/lib/seo";
import { ChogBadge, ChogImage } from "@/components/chog/chog-bits";
import { LoadingState } from "@/components/ui/loading-state";
import { EmptyState } from "@/components/ui/empty-state";

export const Route = createFileRoute("/ranking")({
  validateSearch: (search: Record<string, unknown>): { by?: RankBy } =>
    search.by === "guild" || search.by === "onchain" ? { by: search.by } : {},
  loader: () => getRanking(),
  staticData: { title: "Ranking", crumb: "Ranking" },
  pendingComponent: () => <LoadingState label="Loading page" layout="ladder" />,
  head: () => seo({ title: "Ranking · Choguild", description: "The Choguild ladder: contributors ranked by accepted work, reviews and onchain activity on Monad.", path: "/ranking" }),
  component: RankingPage,
});

const BLURB: Record<RankBy, string> = {
  overall: "Guild XP plus onchain XP.",
  guild: "Accepted submissions, applications and listings.",
  onchain: `Monad transactions, scored 10 × √txs up to ${ONCHAIN_XP_CAP} XP.`,
};

function RankingPage() {
  const { contributors, stats, onchainAvailable } = Route.useLoaderData();
  const by: RankBy = Route.useSearch().by ?? "overall";
  const ranking = rankContributors(contributors, by);

  return (
    <div className="flex flex-col">
      <PageHeader eyebrow="Ranking" title={<>The <em>ladder.</em></>} description="XP from accepted guild work and activity on Monad.">
        <dl className="mt-10 grid grid-cols-3 gap-y-6 border-t border-line pt-6 sm:max-w-xl">
          {([["Passports", stats.passports], ["Accepted", stats.acceptedWork], ["Onchain txs", stats.onchainTxs]] as const).map(([label, value]) => (
            <div key={label} className="border-l border-line pl-4 first:border-l-0 first:pl-0">
              <dt className="t-kicker">{label}</dt>
              <dd className="mt-2 text-2xl font-medium tracking-[-0.04em] tabular-nums text-ink">{value === null ? <span className="text-base text-muted">unavailable</span> : value.toLocaleString("en-US")}</dd>
            </div>
          ))}
        </dl>
      </PageHeader>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div role="tablist" aria-label="Rank by" className="inline-flex self-start rounded-full border border-line p-1">
          {RANK_BY.filter((option) => onchainAvailable || option.id !== "onchain").map((option) => {
            const active = option.id === by;
            return (
              <Link
                key={option.id}
                role="tab"
                aria-selected={active}
                to="/ranking"
                search={option.id === "overall" ? {} : { by: option.id }}
                replace
                className={cn("rounded-full px-4 py-1.5 text-small transition-colors", active ? "bg-ink text-canvas" : "text-body hover:text-ink")}
              >
                {option.label}
              </Link>
            );
          })}
        </div>
        <p className="t-meta">
          {BLURB[by]}{" "}
          <Link to="/how-it-works" hash="xp" className="t-link">How XP works</Link>
        </p>
      </div>
      {!onchainAvailable && by !== "guild" ? (
        <p className="t-body mb-6 flex items-start gap-3 rounded-xl border border-warning/30 px-4 py-3">
          <Activity className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
          Onchain activity is temporarily unavailable (no Monad RPC answered), so the ladder shows guild XP only and the Onchain view is hidden until it is back.
        </p>
      ) : null}

      {ranking.length === 0 ? (
        <EmptyLadder />
      ) : (
        <section aria-label="The ladder" className="surface overflow-hidden">
          <div className="hidden grid-cols-[3rem_minmax(0,1fr)_8rem_6rem_6rem_9rem] gap-6 border-b border-line px-6 py-3 md:grid" aria-hidden="true">
            <span className="t-kicker">Rank</span>
            <span className="t-kicker">Contributor</span>
            <span className="t-kicker">Tier</span>
            <span className="t-kicker text-right">Guild</span>
            <span className="t-kicker text-right">Onchain</span>
            <span className="t-kicker text-right">XP</span>
          </div>
          <ol className="divide-y divide-line">
            {ranking.map((person) => (
              <li key={person.username}>
                <Link
                  to="/passport/$username"
                  params={{ username: person.username }}
                  className="group grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:px-6 md:grid-cols-[3rem_minmax(0,1fr)_8rem_6rem_6rem_9rem] md:gap-6"
                >
                  <span className={cn("tabular-nums tracking-[-0.04em]", person.rank <= 3 ? "text-2xl font-medium text-ink" : "text-lead text-muted")}>{person.rank}</span>
                  <span className="flex min-w-0 items-center gap-3">
                    {person.chog?.tokenIds[0] ? (
                      <ChogImage tokenId={person.chog.tokenIds[0]} size="sm" className="rounded-full" />
                    ) : (
                      <Avatar name={person.displayName} url={person.avatarUrl} />
                    )}
                    <span className="min-w-0">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="truncate text-base font-medium text-ink">{person.displayName}</span>
                        <ChogBadge count={person.chog?.count ?? 0} className="shrink-0" />
                      </span>
                      <span className="block truncate text-small text-muted">
                        @{person.username}
                        <span className="md:hidden"> · {person.tier}</span>
                      </span>
                    </span>
                  </span>
                  <span className="hidden md:block"><TierBadge tier={person.tier} /></span>
                  <span className="hidden text-right text-small tabular-nums text-body md:block">
                    {formatXp(person.guildXp)}
                    {person.chogBonus ? <span className="block text-label text-muted">incl. +{person.chogBonus} Chog</span> : null}
                  </span>
                  <span className="hidden text-right text-small tabular-nums text-body md:block">{person.onchainXp === null ? "—" : formatXp(person.onchainXp)}</span>
                  <span className="text-right">
                    <span className="text-lead font-medium tabular-nums tracking-[-0.03em] text-ink">{formatXp(person.xp)}</span>
                    {by === "overall" ? <span className="mt-2 hidden md:block"><XpBar xp={person.xp} compact /></span> : null}
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

function EmptyLadder() {
  return (
    <EmptyState
      title="Nobody is ranked yet"
      body="Save a public passport to join the ladder. Accepted work moves you up."
      action={
        <>
          <Button asChild size="compact"><Link to="/passport">Claim your spot</Link></Button>
          <Button asChild size="compact" variant="secondary"><Link to="/how-it-works">How it works</Link></Button>
        </>
      }
    />
  );
}
