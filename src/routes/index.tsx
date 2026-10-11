import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Compass, FileCheck2, IdCard, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ProjectMark } from "@/components/board/opportunity-card";
import { Avatar, TierBadge } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
import { listBoard } from "@/lib/board/functions";
import { COMPENSATION_LABEL, type CompensationType } from "@/lib/board/copy";
import { projectLabel } from "@/lib/board/display";
import { emptyBoardSearch } from "@/lib/board/search";
import { getPassportState } from "@/lib/passport/functions";
import { getRanking } from "@/lib/ranking/functions";
import { formatXp, rankContributors } from "@/lib/ranking/xp";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [passport, board, ranking] = await Promise.all([
      getPassportState(),
      listBoard({ data: { ...emptyBoardSearch(), status: "all", page: 1 } }),
      getRanking(),
    ]);
    return {
      ...passport,
      featured: board.items.slice(0, 4),
      leaders: rankContributors(ranking.contributors, "overall", 5),
      stats: ranking.stats,
    };
  },
  staticData: { title: "Home" },
  head: () => ({ meta: [{ title: "Choguild · The contributor ecosystem on Monad" }] }),
  component: HomePage,
});

/** What Choguild connects, in order. Real product concepts, not endorsements. */
const ECOSYSTEM: { label: string; to: "/passport" | "/discover" | "/submissions" | "/ranking"; icon: LucideIcon }[] = [
  { label: "Identity", to: "/passport", icon: IdCard },
  { label: "Opportunities", to: "/discover", icon: Compass },
  { label: "Work submissions", to: "/submissions", icon: FileCheck2 },
  { label: "Accepted contributions", to: "/ranking", icon: BadgeCheck },
];

function HomePage() {
  return (
    <>
      <Hero />
      <Inside />
      <Footer />
    </>
  );
}

function Hero() {
  const { profile } = Route.useLoaderData();

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[max(660px,100svh)] flex-col md:min-h-[clamp(720px,100svh,880px)] lg:min-h-[clamp(820px,100svh,1000px)]"
    >
      <div className="landing-hero-bg" aria-hidden="true" />

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 pt-32 pb-12 text-center sm:px-8 sm:pt-36">
        <p className="rise text-[11px] font-medium tracking-[0.2em] text-[var(--l-muted)] uppercase sm:text-xs">
          The contributor ecosystem on Monad
        </p>

        <h1
          id="hero-title"
          className="landing-headline rise mt-6 max-w-[14ch] text-[clamp(2.5rem,1.1rem+4.4vw,4.75rem)] [animation-delay:60ms] sm:mt-7"
        >
          Show the work.
          <br />
          <span className="text-[#bdb3cf]">Wear the name.</span>
        </h1>

        <p className="rise mt-6 max-w-[33rem] text-[16px] leading-7 text-balance text-[var(--l-body)] [animation-delay:120ms] sm:mt-7 sm:text-[18px] sm:leading-8">
          Build your identity, find opportunities, and create a record of the work you&rsquo;ve delivered.
        </p>

        <div className="rise mt-9 flex w-full flex-col items-stretch justify-center gap-3 [animation-delay:180ms] min-[400px]:w-auto min-[400px]:flex-row min-[400px]:items-center">
          <Link
            to="/discover"
            search={emptyBoardSearch()}
            className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--l-violet)] px-5 text-[15px] font-medium text-white transition-colors hover:bg-[#7c3aed]"
          >
            Explore opportunities
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
          <Link
            to="/passport"
            className="inline-flex h-11 items-center justify-center rounded-xl border border-[var(--l-border)] bg-black/40 px-5 text-[15px] font-medium text-[var(--l-ink)] transition-colors hover:border-white/25 hover:bg-white/5"
          >
            {profile ? "Open your Passport" : "Create your Passport"}
          </Link>
        </div>
      </div>

      <EcosystemStrip />
    </section>
  );
}

function EcosystemStrip() {
  return (
    <div className="relative px-5 pb-10 sm:px-8 sm:pb-14">
      <p className="text-center text-[13px] text-[var(--l-muted)]">One record, from identity to accepted work</p>
      <ol className="mx-auto mt-5 grid max-w-[560px] grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[var(--l-border)] bg-[var(--l-border)] lg:flex lg:max-w-[960px] lg:rounded-full">
        {ECOSYSTEM.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="bg-[#08070b]/90 lg:flex-1">
              <Link
                to={item.to}
                search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                className="flex h-full items-center gap-2.5 px-4 py-3.5 text-[13px] leading-snug text-[var(--l-body)] transition-colors hover:text-[var(--l-ink)] lg:justify-center lg:px-5 lg:text-[14px] lg:whitespace-nowrap"
              >
                <span className="hidden font-mono text-[11px] text-[var(--l-muted)] xl:inline">0{index + 1}</span>
                <Icon className="size-4 shrink-0 text-[var(--l-violet-bright)]" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Inside() {
  const { featured, leaders, stats } = Route.useLoaderData();
  const examplesOnly = featured.length > 0 && featured.every((item) => item.isDemo);

  return (
    <section aria-labelledby="inside-title" className="relative mx-auto w-full max-w-6xl px-5 pt-20 pb-24 sm:px-8 lg:pt-28">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <p className="text-[11px] font-medium tracking-[0.2em] text-[var(--l-muted)] uppercase sm:text-xs">Inside the guild</p>
          <h2 id="inside-title" className="mt-4 text-[clamp(1.75rem,1.1rem+2vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.035em] text-[var(--l-ink)]">
            Live from the board <span className="text-[var(--l-muted)]">and the ladder.</span>
          </h2>
        </div>
        <Link to="/how-it-works" className="text-[14px] text-[var(--l-body)] underline-offset-4 hover:text-[var(--l-ink)] hover:underline">
          How the guild works
        </Link>
      </div>

      <dl className="mt-12 grid grid-cols-2 border-y border-[var(--l-border)] md:grid-cols-4">
        {[
          ["Open opportunities", stats.openOpportunities],
          ["Passports", stats.passports],
          ["Accepted work", stats.acceptedWork],
          ["Onchain transactions", stats.onchainTxs],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={
              "px-1 py-7 md:px-6 " +
              (index % 2 === 1 ? "border-l border-[var(--l-border)] pl-5 md:pl-6 " : "") +
              (index >= 2 ? "border-t border-[var(--l-border)] md:border-t-0 " : "") +
              (index === 2 ? "md:border-l " : "")
            }
          >
            <dt className="text-[13px] text-[var(--l-muted)]">{label}</dt>
            <dd className="mt-3 text-[2.25rem] leading-none font-semibold tracking-[-0.04em] text-[var(--l-ink)] tabular-nums">
              <CountUp value={Number(value)} />
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-8">
        <Panel title="Top of the ladder" to="/ranking">
          {leaders.length > 0 ? (
            <ol className="flex flex-col">
              {leaders.map((person) => (
                <li key={person.username}>
                  <Link
                    to="/passport/$username"
                    params={{ username: person.username }}
                    className="flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-white/[0.04]"
                  >
                    <span className="w-5 text-[13px] tabular-nums text-[var(--l-muted)]">{person.rank}</span>
                    <Avatar name={person.displayName} url={person.avatarUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-[var(--l-ink)]">{person.displayName}</span>
                      <TierBadge tier={person.tier} className="mt-1" />
                    </span>
                    <span className="text-[14px] tabular-nums text-[var(--l-ink)]">{formatXp(person.xp)} XP</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-start gap-5 px-3 py-6">
              <p className="max-w-sm text-[15px] leading-7 text-[var(--l-body)]">
                Nobody has claimed the top spot yet, so the first passport with accepted work leads the ladder.
              </p>
              <Link
                to="/passport"
                className="inline-flex h-10 items-center rounded-xl border border-[var(--l-border)] px-4 text-[14px] text-[var(--l-ink)] transition-colors hover:border-white/25"
              >
                Claim your spot
              </Link>
            </div>
          )}
        </Panel>

        <Panel title={examplesOnly ? "Example opportunities" : "On the board"} to="/discover">
          <ul className="flex flex-col">
            {featured.map((item) => (
              <li key={item.id}>
                <Link
                  to="/discover/$opportunityId"
                  params={{ opportunityId: item.id }}
                  className="flex items-center gap-4 rounded-xl px-3 py-3.5 transition-colors hover:bg-white/[0.04]"
                >
                  <ProjectMark name={projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[15px] text-[var(--l-ink)]">{item.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-[var(--l-muted)]">
                      {projectLabel(item.projectName)}
                      {item.isDemo ? " · Demo" : ""}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[13px] text-[var(--l-body)] sm:block">
                    {COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </section>
  );
}

function Panel({ title, to, children }: { title: string; to: "/ranking" | "/discover"; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-3xl border border-[var(--l-border)] bg-[#0a090d] p-3 sm:p-4">
      <div className="flex items-center justify-between px-3 pt-2 pb-3">
        <h3 className="text-[15px] font-medium tracking-tight text-[var(--l-ink)]">{title}</h3>
        <Link
          to={to}
          search={to === "/discover" ? emptyBoardSearch() : undefined}
          className="text-[13px] text-[var(--l-body)] underline-offset-4 hover:text-[var(--l-ink)] hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="border-t border-[var(--l-border)] pt-2">{children}</div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-[var(--l-border)]">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/brand/choguild-mark.jpg" alt="" width={28} height={28} className="size-7 rounded-lg" />
          <span className="text-[14px] text-[var(--l-body)]">Choguild · Built on Monad</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-[14px] text-[var(--l-muted)]">
          <Link to="/how-it-works" className="hover:text-[var(--l-ink)]">How it works</Link>
          <Link to="/ranking" className="hover:text-[var(--l-ink)]">Ranking</Link>
          <Link to="/network" className="hover:text-[var(--l-ink)]">Network</Link>
        </nav>
      </div>
    </footer>
  );
}
