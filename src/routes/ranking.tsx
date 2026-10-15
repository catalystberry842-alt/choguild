import { Link, createFileRoute } from "@tanstack/react-router";
import { Activity } from "lucide-react";
import { motion } from "motion/react";
import { Reveal } from "@/components/fx/reveal";
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
    <div className="flex flex-col gap-10">
      <PageHeader eyebrow="Ranking" title="The ladder." description="XP from accepted guild work and activity on Monad.">
        <dl className="mt-8 flex flex-wrap justify-center gap-2">
          {([["Passports", stats.passports], ["Accepted", stats.acceptedWork], ["Onchain txs", stats.onchainTxs]] as const).map(([label, value]) => (
            <div key={label} className="flex items-baseline gap-2 rounded-full border border-line bg-elevated/70 px-4 py-2">
              <dd className="t-stat-sm text-ink"><CountUp value={value} /></dd>
              <dt className="text-label text-muted">{label}</dt>
            </div>
          ))}
        </dl>
      </PageHeader>

      <div className="flex flex-col items-center gap-3">
        <div role="tablist" aria-label="Rank by" className="inline-flex rounded-full border border-line bg-elevated/70 p-1">
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
                className={cn("relative rounded-full px-4 py-1.5 text-small transition-colors", active ? "text-on-accent" : "text-body hover:text-ink")}
              >
                {active ? <motion.span layoutId="rank-by" className="absolute inset-0 rounded-full bg-signal" transition={{ type: "spring", bounce: 0.15, duration: 0.45 }} /> : null}
                <span className="relative">{option.label}</span>
              </Link>
            );
          })}
        </div>
        <p className="t-meta">
          {BLURB[by]}{" "}
          <Link to="/how-it-works" hash="xp" className="t-link">How XP works</Link>
        </p>
        {!onchainAvailable && by !== "guild" ? (
          <p className="t-body flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3">
            <Activity className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
            The Monad RPC did not answer just now, so onchain XP is missing and the ladder uses guild XP for the moment.
          </p>
        ) : null}
      </div>

      {podium.length === 0 ? (
        <EmptyLadder />
      ) : (
        <>
          <ol className="grid gap-3 pt-4 md:grid-cols-3 md:items-end">
            {podium.map((person) => (
              <PodiumCard key={person.username} person={person} by={by} />
            ))}
          </ol>

          {rest.length > 0 ? (
            <section aria-label="The ladder" className="bento p-2 sm:p-3">
              <div className="hidden grid-cols-[3.5rem_minmax(0,1fr)_8rem_7rem] gap-4 px-4 py-3 text-label text-muted sm:grid">
                <span>Rank</span>
                <span>Contributor</span>
                <span>Tier</span>
                <span className="text-right">XP</span>
              </div>
              <ol className="flex flex-col gap-0.5">
                {rest.map((person, index) => (
                  <Reveal as="li" key={person.username} delay={Math.min(index, 8) * 0.03} y={6}>
                    <Link
                      to="/passport/$username"
                      params={{ username: person.username }}
                      className="group grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-4 py-3 transition-colors hover:bg-white/[0.04] sm:grid-cols-[3.5rem_minmax(0,1fr)_8rem_7rem]"
                    >
                      <span className="t-stat-sm text-muted">{person.rank}</span>
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={person.displayName} url={person.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block truncate text-base text-ink group-hover:text-signal">{person.displayName}</span>
                          <span className="block truncate text-label text-muted">
                            @{person.username}
                            {person.txCount !== null ? ` · ${formatXp(person.txCount)} txs` : ""}
                          </span>
                        </span>
                      </span>
                      <span className="hidden sm:block"><TierBadge tier={person.tier} /></span>
                      <span className="text-right font-mono text-small tabular-nums text-ink">{formatXp(person.xp)}</span>
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

const PODIUM = ["md:order-2 md:pb-14", "md:order-1", "md:order-3"] as const;

function PodiumCard({ person, by }: { person: RankedContributor; by: RankBy }) {
  const first = person.rank === 1;
  return (
    <Reveal as="li" delay={person.rank * 0.08} className={PODIUM[person.rank - 1]}>
      <Link
        to="/passport/$username"
        params={{ username: person.username }}
        className={cn("bento group flex flex-col items-center gap-4 px-6 py-8 text-center", first && "signal-glow border-signal/30")}
      >
        <span className={cn("t-stat-lg", first ? "text-signal" : "text-faint")}>{person.rank}</span>
        <Avatar name={person.displayName} url={person.avatarUrl} size="lg" />
        <span>
          <span className="t-h3 block text-ink">{person.displayName}</span>
          <span className="block text-label text-muted">@{person.username}</span>
        </span>
        <TierBadge tier={person.tier} />
        <span className="t-stat tabular-nums">
          <CountUp value={person.xp} /> <span className="font-sans text-label text-muted">XP</span>
        </span>
        <span className="text-label text-muted">
          Guild {formatXp(person.guildXp)} · Onchain {person.onchainXp === null ? "—" : formatXp(person.onchainXp)}
        </span>
        {by === "overall" ? <span className="w-full"><XpBar xp={person.xp} /></span> : null}
      </Link>
    </Reveal>
  );
}

function EmptyLadder() {
  return (
    <ol className="grid gap-3 pt-4 md:grid-cols-3 md:items-end">
      {[2, 1, 3].map((rank) => (
        <Reveal as="li" key={rank} delay={rank * 0.08} className={rank === 1 ? "md:order-2 md:pb-14" : rank === 2 ? "md:order-1" : "md:order-3"}>
          <div className={cn("flex flex-col items-center gap-4 rounded-[1.5rem] border border-dashed px-6 py-10 text-center", rank === 1 ? "signal-glow border-signal/40 bg-signal/[0.04]" : "border-line-strong bg-elevated/40")}>
            <span className={cn("t-stat-lg", rank === 1 ? "text-signal" : "text-faint")}>{rank}</span>
            <span className="flex size-16 items-center justify-center rounded-full border border-dashed border-line-strong text-faint">?</span>
            <span className="t-h3 text-ink">{rank === 1 ? "First place is open." : "Open spot"}</span>
            <span className="text-small text-muted">{rank === 1 ? "Save a public passport to join. Accepted work moves you up." : "Waiting for accepted work."}</span>
            {rank === 1 ? (
              <span className="mt-2 flex flex-wrap justify-center gap-2">
                <Button asChild size="compact"><Link to="/passport">Claim your spot</Link></Button>
                <Button asChild size="compact" variant="secondary"><Link to="/how-it-works">How it works</Link></Button>
              </span>
            ) : null}
          </div>
        </Reveal>
      ))}
    </ol>
  );
}
