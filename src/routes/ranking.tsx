import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { motion } from "motion/react";
import { Reveal } from "@/components/fx/reveal";
import { Avatar, RankMedal, TierBadge, XpBar } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { cn } from "@/lib/cn";
import { getRanking } from "@/lib/ranking/functions";
import {
  ONCHAIN_XP_CAP,
  RANK_BY,
  formatXp,
  rankContributors,
  type RankBy,
  type RankedContributor,
} from "@/lib/ranking/xp";

export const Route = createFileRoute("/ranking")({
  validateSearch: (search: Record<string, unknown>): { by?: RankBy } =>
    search.by === "guild" || search.by === "onchain" ? { by: search.by } : {},
  loader: () => getRanking(),
  staticData: { title: "Ranking", crumb: "Ranking" },
  head: () => ({ meta: [{ title: "Ranking · Choguild" }] }),
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
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="flex flex-col gap-12">
      <PageHeader title="Ranking" description="XP from accepted guild work and activity on Monad." />

      <dl className="surface grid grid-cols-3 divide-x divide-line overflow-hidden rounded-2xl">
        <Stat label="Passports" value={stats.passports} />
        <Stat label="Accepted" value={stats.acceptedWork} />
        <Stat label="Onchain txs" value={stats.onchainTxs} />
      </dl>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Rank by" className="inline-flex w-fit rounded-full border border-white/10 bg-white/[0.03] p-1 backdrop-blur">
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
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    active ? "text-canvas" : "text-body hover:text-ink",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="rank-by"
                      className="absolute inset-0 rounded-full bg-ink"
                      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
                    />
                  ) : null}
                  <span className="relative">{option.label}</span>
                </Link>
              );
            })}
          </div>
          <Link to="/how-it-works" hash="xp" className="text-sm font-medium text-ink underline-offset-4 hover:underline">
            How XP works
          </Link>
        </div>
        <p className="t-meta -mt-2">{BLURB[by]}</p>

        {!onchainAvailable && by !== "guild" ? (
          <p className="surface t-body flex items-start gap-3 px-5 py-4">
            <Activity className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            The Monad RPC did not answer just now, so onchain XP is missing and the ladder uses guild XP for the moment.
          </p>
        ) : null}
      </section>

      {ranking.length === 0 ? (
        <EmptyLadder />
      ) : (
        <>
          <ol className="grid gap-5 pt-2 md:grid-cols-3 md:items-end md:pt-8">
            {podium.map((person) => (
              <PodiumCard key={person.username} person={person} by={by} />
            ))}
          </ol>

          {rest.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-[12px] font-medium tracking-[0.18em] text-muted uppercase">The ladder</h2>
              <ol className="surface overflow-hidden rounded-2xl">
                <li className="hidden grid-cols-[3rem_minmax(0,1fr)_7rem_6rem] gap-4 border-b border-line px-5 py-3 text-[11px] tracking-wide text-muted uppercase sm:grid">
                  <span>Rank</span>
                  <span>Contributor</span>
                  <span>Tier</span>
                  <span className="text-right">XP</span>
                </li>
                {rest.map((person, index) => (
                  <Reveal as="li" key={person.username} delay={Math.min(index, 8) * 0.03} y={8} className="border-b border-line last:border-b-0">
                    <Link
                      to="/passport/$username"
                      params={{ username: person.username }}
                      className="grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03] sm:grid-cols-[3rem_minmax(0,1fr)_7rem_6rem]"
                    >
                      <RankMedal rank={person.rank} />
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={person.displayName} url={person.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-medium text-ink">{person.displayName}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            @{person.username}
                            {person.txCount !== null ? ` · ${formatXp(person.txCount)} txs` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="hidden sm:block">
                        <TierBadge tier={person.tier} />
                      </span>
                      <span className="text-right text-sm font-semibold tabular-nums text-ink">{formatXp(person.xp)} XP</span>
                    </Link>
                  </Reveal>
                ))}
              </ol>
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 px-4 py-5 sm:px-6">
      <dt className="truncate text-[11px] tracking-wide text-muted uppercase sm:text-[12px]">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold sm:text-[1.75rem] tracking-[-0.03em] tabular-nums text-ink">
        <CountUp value={value} />
      </dd>
    </div>
  );
}

const PODIUM = [
  { order: "md:order-2", lift: "md:-translate-y-6", glow: "rgb(212 175 90 / 0.18)" },
  { order: "md:order-1", lift: "", glow: "rgb(190 195 210 / 0.12)" },
  { order: "md:order-3", lift: "", glow: "rgb(190 120 70 / 0.14)" },
] as const;

function PodiumCard({ person, by }: { person: RankedContributor; by: RankBy }) {
  const style = PODIUM[person.rank - 1];
  return (
    <Reveal as="li" className={style.order} delay={person.rank * 0.06}>
      <Link
        to="/passport/$username"
        params={{ username: person.username }}
        className={cn("surface spotlight card-pop relative flex flex-col items-center gap-4 overflow-hidden px-6 py-8 text-center", style.lift)}
      >
        <span
          className="pointer-events-none absolute inset-x-0 top-0 h-32"
          style={{ background: `radial-gradient(70% 100% at 50% 0%, ${style.glow}, transparent)` }}
          aria-hidden="true"
        />
        <RankMedal rank={person.rank} size="lg" />
        <Avatar name={person.displayName} url={person.avatarUrl} size="lg" />
        <span>
          <span className="block text-[16px] font-semibold tracking-[-0.02em] text-ink">{person.displayName}</span>
          <span className="mt-0.5 block text-xs text-muted">@{person.username}</span>
        </span>
        <TierBadge tier={person.tier} />
        <span className="text-[2rem] leading-none font-semibold tracking-[-0.04em] tabular-nums text-ink">
          <CountUp value={person.xp} /> <span className="text-sm font-normal tracking-normal text-muted">XP</span>
        </span>
        <span className="flex gap-3 text-xs text-muted">
          <span>Guild {formatXp(person.guildXp)}</span>
          <span aria-hidden="true">·</span>
          <span>Onchain {person.onchainXp === null ? "—" : formatXp(person.onchainXp)}</span>
        </span>
        {by === "overall" ? (
          <span className="w-full">
            <XpBar xp={person.xp} />
          </span>
        ) : null}
      </Link>
    </Reveal>
  );
}

function EmptyLadder() {
  return (
    <EmptyState
      title="First place is open"
      body="Save a public Passport to join. Accepted work moves you up."
      action={
        <>
          <Button asChild>
            <Link to="/passport">Claim your spot</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/how-it-works">How it works</Link>
          </Button>
        </>
      }
    />
  );
}
