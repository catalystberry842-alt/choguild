import { Link, createFileRoute } from "@tanstack/react-router";
import { Crown, Medal, Trophy } from "lucide-react";
import { Avatar, TierBadge, XpBar } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import type { RankedContributor } from "@/lib/ranking/repo.server";
import { getRanking } from "@/lib/ranking/functions";
import { XP_RULES, formatXp } from "@/lib/ranking/xp";

export const Route = createFileRoute("/ranking")({
  loader: () => getRanking(),
  staticData: { title: "Ranking", crumb: "Ranking" },
  head: () => ({ meta: [{ title: "Ranking · Choguild" }] }),
  component: RankingPage,
});

function RankingPage() {
  const { ranking, stats } = Route.useLoaderData();
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);

  return (
    <div className="flex flex-col gap-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.2em] text-sand uppercase">Guild ranking</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-ink sm:text-5xl">The Chog ladder</h1>
          <p className="mt-3 max-w-xl text-body">
            Every public passport earns XP from real, reviewed activity. No likes, no follower counts, just work that
            shipped.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link to="/how-it-works" hash="xp">How XP works</Link>
        </Button>
      </header>

      <dl className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-elevated">
        <Stat label="Passports" value={stats.passports} />
        <Stat label="Open work" value={stats.openOpportunities} />
        <Stat label="Accepted" value={stats.acceptedWork} />
      </dl>

      {ranking.length === 0 ? (
        <EmptyLadder />
      ) : (
        <>
          <ol className="stagger grid gap-4 md:grid-cols-3 md:items-end">
            {podium.map((person) => (
              <PodiumCard key={person.username} person={person} />
            ))}
          </ol>

          {rest.length > 0 ? (
            <section>
              <h2 className="text-lg font-bold text-ink">Everyone else on the ladder</h2>
              <ol className="stagger mt-3 divide-y divide-line overflow-hidden rounded-xl border border-line bg-elevated">
                {rest.map((person) => (
                  <li key={person.username}>
                    <Link
                      to="/passport/$username"
                      params={{ username: person.username }}
                      className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary"
                    >
                      <span className="font-mono text-sm text-muted">#{person.rank}</span>
                      <span className="flex min-w-0 items-center gap-3">
                        <Avatar name={person.displayName} url={person.avatarUrl} />
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-ink">{person.displayName}</span>
                          <span className="block truncate text-xs text-muted">@{person.username}</span>
                        </span>
                      </span>
                      <span className="flex flex-col items-end gap-1">
                        <span className="font-mono text-sm font-semibold text-ink">{formatXp(person.xp)} XP</span>
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
    <div className="px-3 py-4 text-center sm:px-6">
      <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</dt>
      <dd className="mt-1 font-mono text-2xl font-bold text-ink sm:text-3xl">
        <CountUp value={value} />
      </dd>
    </div>
  );
}

const PODIUM = [
  { icon: Crown, ring: "border-warning/60", label: "text-warning", order: "md:order-2", lift: "md:pb-10" },
  { icon: Medal, ring: "border-line", label: "text-body", order: "md:order-1", lift: "" },
  { icon: Trophy, ring: "border-line", label: "text-body", order: "md:order-3", lift: "" },
] as const;

function PodiumCard({ person }: { person: RankedContributor }) {
  const style = PODIUM[person.rank - 1];
  const Icon = style.icon;
  return (
    <li className={cn(style.order)}>
      <Link
        to="/passport/$username"
        params={{ username: person.username }}
        className={cn("card-pop flex flex-col items-center gap-3 rounded-2xl border bg-elevated p-6 pt-5 text-center", style.ring, style.lift)}
      >
        <span className={cn("flex items-center gap-1 font-mono text-sm font-bold", style.label)}>
          <Icon className="size-4" aria-hidden="true" />#{person.rank}
        </span>
        <Avatar name={person.displayName} url={person.avatarUrl} size="lg" />
        <span>
          <span className="block font-semibold text-ink">{person.displayName}</span>
          <span className="block text-xs text-muted">@{person.username}</span>
        </span>
        <TierBadge tier={person.tier} />
        <span className="font-mono text-2xl font-bold text-ink">{formatXp(person.xp)} <span className="text-sm text-muted">XP</span></span>
        <span className="w-full">
          <XpBar xp={person.xp} />
        </span>
      </Link>
    </li>
  );
}

function EmptyLadder() {
  return (
    <section className="dot-grid rounded-2xl border border-dashed border-line p-8 text-center sm:p-12">
      <Trophy className="mx-auto size-10 text-ink" aria-hidden="true" />
      <h2 className="mt-4 text-2xl font-bold text-ink">The ladder is empty, so first place is yours to take.</h2>
      <p className="mx-auto mt-2 max-w-md text-body">
        Save a public passport and you are on the board with {XP_RULES.find((rule) => rule.key === "passport")?.points} XP.
        Accepted work is where the real points are.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
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
