import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity, Crown, Medal, Trophy } from "lucide-react";
import { motion } from "motion/react";
import { Avatar, TierBadge, XpBar } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
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

      <dl className="grid grid-cols-3 gap-3 sm:gap-4">
        <Stat label="Passports" value={stats.passports} />
        <Stat label="Accepted work" value={stats.acceptedWork} />
        <Stat label="Onchain txs" value={stats.onchainTxs} />
      </dl>

      <section className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Rank by" className="inline-flex w-fit rounded-full border border-line bg-elevated p-1">
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
          <ol className="stagger grid gap-5 md:grid-cols-3 md:items-end">
            {podium.map((person) => (
              <PodiumCard key={person.username} person={person} by={by} />
            ))}
          </ol>

          {rest.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="t-h3">Everyone else</h2>
              <ol className="stagger flex flex-col gap-3">
                {rest.map((person) => (
                  <li key={person.username}>
                    <Link
                      to="/passport/$username"
                      params={{ username: person.username }}
                      className="card-pop surface grid grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-4 px-5 py-4"
                    >
                      <span className="text-sm tabular-nums text-muted">#{person.rank}</span>
                      <span className="flex min-w-0 items-center gap-4">
                        <Avatar name={person.displayName} url={person.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-ink">{person.displayName}</span>
                          <span className="mt-0.5 block truncate text-xs text-muted">
                            @{person.username}
                            {person.txCount !== null ? ` · ${formatXp(person.txCount)} txs` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1.5">
                        <span className="text-sm font-semibold tabular-nums text-ink">{formatXp(person.xp)} XP</span>
                        <TierBadge tier={person.tier} />
                      </span>
                    </Link>
                  </li>
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
    <div className="surface px-4 py-4 sm:px-5 sm:py-5">
      <dt className="t-meta">{label}</dt>
      <dd className="mt-1.5 text-2xl font-semibold tracking-[-0.03em] tabular-nums text-ink">
        <CountUp value={value} />
      </dd>
    </div>
  );
}

const PODIUM = [
  { icon: Crown, ring: "border-ink/70", order: "md:order-2", lift: "md:pb-10" },
  { icon: Medal, ring: "border-line", order: "md:order-1", lift: "" },
  { icon: Trophy, ring: "border-line", order: "md:order-3", lift: "" },
] as const;

function PodiumCard({ person, by }: { person: RankedContributor; by: RankBy }) {
  const style = PODIUM[person.rank - 1];
  const Icon = style.icon;
  return (
    <li className={style.order}>
      <Link
        to="/passport/$username"
        params={{ username: person.username }}
        className={cn("card-pop flex flex-col items-center gap-4 rounded-3xl border bg-elevated px-6 py-7 text-center", style.ring, style.lift)}
      >
        <span className="flex items-center gap-1.5 text-sm font-semibold tabular-nums text-ink">
          <Icon className="size-4" aria-hidden="true" />#{person.rank}
        </span>
        <Avatar name={person.displayName} url={person.avatarUrl} size="lg" />
        <span>
          <span className="block font-semibold text-ink">{person.displayName}</span>
          <span className="mt-0.5 block text-xs text-muted">@{person.username}</span>
        </span>
        <TierBadge tier={person.tier} />
        <span className="text-2xl font-semibold tabular-nums text-ink">
          {formatXp(person.xp)} <span className="text-sm font-normal text-muted">XP</span>
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
    </li>
  );
}

function EmptyLadder() {
  return (
    <section className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-line px-6 py-12 text-center">
      <Trophy className="size-10 text-ink" aria-hidden="true" />
      <h2 className="t-h2">First place is open</h2>
      <p className="t-body max-w-sm">Save a public Passport to join. Accepted work moves you up.</p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link to="/passport">Claim your spot</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/how-it-works">How it works</Link>
        </Button>
      </div>
    </section>
  );
}
