import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import type { ReactNode } from "react";
import { ProjectMark } from "@/components/board/opportunity-card";
import { Avatar, TierBadge } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
import { Button } from "@/components/ui/button";
import { listBoard } from "@/lib/board/functions";
import { COMPENSATION_LABEL, type CompensationType } from "@/lib/board/copy";
import { projectLabel } from "@/lib/board/display";
import { emptyBoardSearch } from "@/lib/board/search";
import { cn } from "@/lib/cn";
import { getPassportState } from "@/lib/passport/functions";
import { shortAddress } from "@/lib/passport/format";
import { getRanking } from "@/lib/ranking/functions";
import { formatXp, rankContributors } from "@/lib/ranking/xp";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [passport, board, ranking] = await Promise.all([
      getPassportState(),
      listBoard({ data: { ...emptyBoardSearch(), status: "all", page: 1 } }),
      getRanking(),
    ]);
    return { ...passport, featured: board.items.slice(0, 3), leaders: rankContributors(ranking.contributors, "overall", 5), stats: ranking.stats };
  },
  staticData: { title: "Home" },
  head: () => ({ meta: [{ title: "Home · Choguild" }] }),
  component: HomePage,
});

function HomePage() {
  const { sessionAddress, profile, featured, leaders, stats } = Route.useLoaderData();
  const examplesOnly = featured.length > 0 && featured.every((item) => item.isDemo);
  const who = profile ? `@${profile.username}` : sessionAddress ? shortAddress(sessionAddress) : null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-12">
      <section className="flex flex-col gap-4">
        <h1 className="text-[1.9rem] leading-tight font-bold tracking-tight text-ink sm:text-[2.4rem]">
          Show the work and <span className="marker">wear the name.</span>
        </h1>
        <p className="max-w-xl text-[15px] leading-7 text-body">
          The contributor guild for Monad, where you claim a passport, pick up real work, and climb the ranking with
          every accepted contribution.
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <Button asChild>
            <Link to="/discover" search={emptyBoardSearch()}>
              Explore opportunities
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild variant="secondary">
            <Link to="/passport">{profile ? "Your passport" : "Create passport"}</Link>
          </Button>
          {who ? (
            <span className="rounded-full border border-line bg-elevated px-3 py-1.5 font-mono text-xs text-body">{who}</span>
          ) : null}
        </div>
      </section>

      <div className="stagger grid grid-cols-2 gap-4">
        <Tile to="/discover" label="Open work" value={stats.openOpportunities} active />
        <Tile to="/ranking" label="Passports" value={stats.passports} />
        <Tile to="/submissions" label="Accepted work" value={stats.acceptedWork} />
        <Tile to="/how-it-works" label="How it works" />
      </div>

      <Panel
        title="Top of the ladder"
        action={
          <Link to="/ranking" className="text-sm font-medium text-ink">
            View all
          </Link>
        }
      >
        {leaders.length > 0 ? (
          <>
            <ColumnHeads left="Name" right="XP" />
            <ol>
              {leaders.map((person) => (
                <li key={person.username}>
                  <Link
                    to="/passport/$username"
                    params={{ username: person.username }}
                    className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-secondary"
                  >
                    <span className="w-5 text-xs tabular-nums text-muted">{person.rank}</span>
                    <Avatar name={person.displayName} url={person.avatarUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-ink">{person.displayName}</span>
                      <TierBadge tier={person.tier} className="mt-0.5" />
                    </span>
                    <span className="text-sm font-medium tabular-nums text-ink">{formatXp(person.xp)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </>
        ) : (
          <div className="flex flex-col items-start gap-4 px-5 py-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-body">Nobody has claimed the top spot yet, so it is yours to take.</p>
            <Button asChild size="compact" variant="secondary">
              <Link to="/passport">Claim it</Link>
            </Button>
          </div>
        )}
      </Panel>

      <Panel
        title={examplesOnly ? "Example opportunities" : "On the board"}
        action={
          <Link to="/discover" search={emptyBoardSearch()} className="text-sm font-medium text-ink">
            View all
          </Link>
        }
      >
        <ColumnHeads left="Opportunity" right="Pay" />
        <ul>
          {featured.map((item) => (
            <li key={item.id}>
              <Link
                to="/discover/$opportunityId"
                params={{ opportunityId: item.id }}
                className="flex items-center gap-4 rounded-2xl px-4 py-4 transition-colors hover:bg-secondary"
              >
                <ProjectMark name={projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-ink">{item.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {projectLabel(item.projectName)}
                    {item.isDemo ? " · Demo" : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs text-body">
                  {COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function Tile({
  to,
  label,
  value,
  active = false,
}: {
  to: "/discover" | "/ranking" | "/submissions" | "/how-it-works";
  label: string;
  value?: number;
  active?: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "card-pop group relative flex min-h-28 flex-col justify-center rounded-3xl border bg-elevated px-6 py-5",
        active ? "border-ink/60" : "border-line",
      )}
    >
      <span className={cn("text-[15px]", value === undefined ? "text-lg font-medium text-ink" : "text-body")}>{label}</span>
      {value !== undefined ? (
        <span className="mt-2 text-2xl font-medium tabular-nums text-ink">
          <CountUp value={value} />
        </span>
      ) : null}
      <ArrowUpRight
        className="absolute top-5 right-5 size-4 text-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden="true"
      />
    </Link>
  );
}

function Panel({ title, action, children }: { title: string; action: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-3xl border border-line bg-elevated p-3">
      <div className="flex items-center justify-between rounded-2xl bg-secondary px-5 py-4">
        <h2 className="text-base font-semibold tracking-tight text-ink">{title}</h2>
        {action}
      </div>
      <div className="mt-2 flex flex-col gap-1 pb-1">{children}</div>
    </section>
  );
}

function ColumnHeads({ left, right }: { left: string; right: string }) {
  return (
    <div className="mx-2 mb-1 flex justify-between rounded-xl border border-line px-4 py-2.5 text-[11px] font-medium tracking-wide text-muted uppercase">
      <span>{left}</span>
      <span>{right}</span>
    </div>
  );
}
