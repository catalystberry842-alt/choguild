import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { Reveal } from "@/components/fx/reveal";
import { Avatar, TierBadge, XpBar } from "@/components/ranking/bits";
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
  const leader = ranking[0];
  const rest = ranking.slice(1);

  return (
    <div className="flex flex-col gap-14">
      <PageHeader eyebrow="Ranking" title="The ladder." description="XP from accepted guild work and activity on Monad." />

      <dl className="-mt-4 grid grid-cols-3 overflow-hidden rounded-[1.25rem] border border-line bg-elevated/70">
        <Stat label="Passports" value={stats.passports} index={1} />
        <Stat label="Accepted" value={stats.acceptedWork} index={2} />
        <Stat label="Onchain txs" value={stats.onchainTxs} index={3} />
      </dl>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div role="tablist" aria-label="Rank by" className="seg">
            {RANK_BY.map((option) => (
              <Link
                key={option.id}
                role="tab"
                aria-selected={option.id === by}
                to="/ranking"
                search={option.id === "overall" ? {} : { by: option.id }}
                replace
                className="seg-item"
              >
                {option.label}
              </Link>
            ))}
          </div>
          <Link to="/how-it-works" hash="xp" className="t-link text-[13px]">
            How XP works
          </Link>
        </div>
        <p className="t-meta">{BLURB[by]}</p>

        {!onchainAvailable && by !== "guild" ? (
          <p className="t-body flex items-start gap-3 border-l-2 border-warning py-1 pl-4">
            <Activity className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            The Monad RPC did not answer just now, so onchain XP is missing and the ladder uses guild XP for the moment.
          </p>
        ) : null}
      </section>

      {!leader ? (
        <EmptyLadder />
      ) : (
        <>
          <Leader person={leader} by={by} />

          {rest.length > 0 ? (
            <section aria-label="The ladder">
              <div className="hidden grid-cols-[4rem_minmax(0,1fr)_8rem_7rem_7rem] gap-4 px-6 pb-3 sm:grid">
                <span className="t-label">Rank</span>
                <span className="t-label">Contributor</span>
                <span className="t-label">Tier</span>
                <span className="t-label text-right">Guild / Chain</span>
                <span className="t-label text-right">XP</span>
              </div>
              <ol className="panel">
                {rest.map((person, index) => (
                  <Reveal as="li" key={person.username} delay={Math.min(index, 8) * 0.03} y={6} className="border-b border-line">
                    <Link
                      to="/passport/$username"
                      params={{ username: person.username }}
                      className="row-link group grid grid-cols-[3rem_minmax(0,1fr)_auto] items-center gap-4 py-4 sm:grid-cols-[4rem_minmax(0,1fr)_8rem_7rem_7rem]"
                    >
                      <span className={cn("t-display text-[1.25rem] leading-none tabular-nums", person.rank <= 3 ? "text-ink" : "text-faint")}>
                        {person.rank}
                      </span>
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={person.displayName} url={person.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] text-ink transition-colors group-hover:text-signal">{person.displayName}</span>
                          <span className="block truncate font-mono text-[11px] text-muted">
                            @{person.username}
                            {person.txCount !== null ? ` · ${formatXp(person.txCount)} txs` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="hidden sm:block">
                        <TierBadge tier={person.tier} />
                      </span>
                      <span className="hidden text-right font-mono text-[12px] text-muted tabular-nums sm:block">
                        {formatXp(person.guildXp)} / {person.onchainXp === null ? "—" : formatXp(person.onchainXp)}
                      </span>
                      <span className="text-right font-mono text-[14px] tabular-nums text-ink">{formatXp(person.xp)}</span>
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

function Stat({ label, value, index }: { label: string; value: number; index: number }) {
  return (
    <div className={cn("min-w-0 px-4 py-6 sm:px-6", index > 1 && "border-l border-line")}>
      <dt className="truncate text-[13px] text-muted">
        {label}
      </dt>
      <dd className="t-display mt-3 text-[clamp(2rem,1.4rem+2vw,3rem)] leading-none tabular-nums">
        <CountUp value={value} />
      </dd>
    </div>
  );
}

/** First place gets the editorial treatment: a huge numeral, the name set in serif, and the split. */
function Leader({ person, by }: { person: RankedContributor; by: RankBy }) {
  return (
    <Reveal>
      <Link
        to="/passport/$username"
        params={{ username: person.username }}
        className="surface group grid gap-8 p-6 sm:p-10 md:grid-cols-12 md:items-end"
      >
        <span className="t-display text-[clamp(5rem,3.5rem+6vw,8.5rem)] leading-[0.85] text-signal md:col-span-3">1</span>
        <span className="flex min-w-0 flex-col gap-4 md:col-span-5">
          <span className="t-label">Top of the ladder</span>
          <span className="flex items-center gap-4">
            <Avatar name={person.displayName} url={person.avatarUrl} size="lg" />
            <span className="min-w-0">
              <span className="t-display block truncate text-[1.75rem] leading-tight transition-colors group-hover:text-signal">{person.displayName}</span>
              <span className="block font-mono text-[12px] text-muted">@{person.username}</span>
            </span>
          </span>
          <TierBadge tier={person.tier} className="self-start" />
        </span>
        <span className="flex flex-col gap-3 md:col-span-4 md:items-end md:text-right">
          <span className="t-display text-[3rem] leading-none tabular-nums">
            <CountUp value={person.xp} /> <span className="font-mono text-[12px] text-muted">XP</span>
          </span>
          <span className="font-mono text-[11px] text-muted">
            Guild {formatXp(person.guildXp)} · Onchain {person.onchainXp === null ? "—" : formatXp(person.onchainXp)}
          </span>
          {by === "overall" ? (
            <span className="w-full md:max-w-64">
              <XpBar xp={person.xp} />
            </span>
          ) : null}
        </span>
      </Link>
    </Reveal>
  );
}

function EmptyLadder() {
  return (
    <EmptyState
      title="First place is open."
      body="Save a public passport to join. Accepted work moves you up."
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
