import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Check, Compass, FileCheck2, IdCard, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { ProjectMark } from "@/components/board/opportunity-card";
import { DotField } from "@/components/landing/dot-field";
import { Avatar, TierBadge } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { COMPENSATION_LABEL, type CompensationType } from "@/lib/board/copy";
import { projectLabel } from "@/lib/board/display";
import { listBoard } from "@/lib/board/functions";
import { emptyBoardSearch } from "@/lib/board/search";
import { getPassportState } from "@/lib/passport/functions";
import { getRanking } from "@/lib/ranking/functions";
import { TIERS, XP_RULES, formatXp, rankContributors } from "@/lib/ranking/xp";

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

/** What Choguild connects, in order. Product concepts, not endorsements. */
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
      <Loop />
      <Inside />
      <Sides />
      <Footer />
    </>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="t-eyebrow">{children}</p>;
}

function SectionTitle({ id, children }: { id: string; children: ReactNode }) {
  return (
    <h2 id={id} className="mt-4 text-[clamp(1.75rem,1.1rem+2vw,2.5rem)] leading-[1.08] font-semibold tracking-[-0.04em] text-ink">
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ Hero */

function Hero() {
  const { profile } = Route.useLoaderData();

  return (
    <section
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[max(660px,100svh)] flex-col md:min-h-[clamp(720px,100svh,880px)] lg:min-h-[clamp(820px,100svh,1000px)]"
    >
      <div className="landing-hero-bg" aria-hidden="true">
        <DotField />
      </div>

      <div className="relative flex flex-1 flex-col items-center justify-center px-5 pt-32 pb-12 text-center sm:px-8 sm:pt-36">
        <p className="rise text-[10px] font-medium tracking-[0.14em] whitespace-nowrap text-muted uppercase min-[370px]:text-[11px] min-[370px]:tracking-[0.2em] sm:text-xs">
          The contributor ecosystem on Monad
        </p>

        <h1
          id="hero-title"
          className="landing-headline rise mt-6 text-[2.25rem] [animation-delay:60ms] min-[370px]:text-[clamp(2.5rem,1.1rem+4.4vw,4.75rem)] sm:mt-7"
        >
          {/* Each line is one unbreakable unit, so the headline is always exactly two lines. */}
          <span className="block whitespace-nowrap">Show the work.</span>
          <span className="block whitespace-nowrap text-[#bdb3cf]">Wear the name.</span>
        </h1>

        <p className="rise mt-6 max-w-[33rem] text-[16px] leading-7 text-balance text-body [animation-delay:120ms] sm:mt-7 sm:text-[18px] sm:leading-8">
          Build your identity, find opportunities, and create a record of the work you&rsquo;ve delivered.
        </p>

        <div className="rise mt-9 flex w-full flex-col items-stretch justify-center gap-3 [animation-delay:180ms] min-[400px]:w-auto min-[400px]:flex-row min-[400px]:items-center">
          <Button asChild size="lg" className="group">
            <Link to="/discover" search={emptyBoardSearch()}>
              Explore opportunities
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="secondary" className="bg-black/40 backdrop-blur-sm">
            <Link to="/passport">{profile ? "Open your Passport" : "Create your Passport"}</Link>
          </Button>
        </div>
      </div>

      <EcosystemStrip />
    </section>
  );
}

function EcosystemStrip() {
  return (
    <div className="relative px-5 pb-10 sm:px-8 sm:pb-14">
      <p className="t-meta text-center">One record, from identity to accepted work</p>
      <ol className="mx-auto mt-5 grid max-w-[560px] grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:flex lg:max-w-[960px] lg:rounded-full">
        {ECOSYSTEM.map((item, index) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="bg-[#08070b]/90 lg:flex-1">
              <Link
                to={item.to}
                search={item.to === "/discover" ? emptyBoardSearch() : undefined}
                className="flex h-full items-center gap-2.5 px-4 py-3.5 text-[13px] leading-snug text-body transition-colors hover:text-ink lg:justify-center lg:px-5 lg:text-[14px] lg:whitespace-nowrap"
              >
                <span className="hidden font-mono text-[11px] text-muted xl:inline">0{index + 1}</span>
                <Icon className="size-4 shrink-0 text-[#a78bfa]" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/* ------------------------------------------------------------------ The loop */

const passportXp = XP_RULES.find((rule) => rule.key === "passport")?.points ?? 0;
const acceptedXp = XP_RULES.find((rule) => rule.key === "acceptedSubmissions")?.points ?? 0;

const STEPS: { title: string; body: string; visual: ReactNode }[] = [
  {
    title: "Claim your Passport",
    body: "Sign one free message with your wallet, then add a username, skills and links. That's your public profile.",
    visual: <PassportSketch />,
  },
  {
    title: "Pick up open work",
    body: "Filter the board by skill, category and pay. Apply with a short pitch and track every decision.",
    visual: <BoardSketch />,
  },
  {
    title: "Ship it and rank up",
    body: `Submit evidence once you're accepted. Accepted work is worth ${acceptedXp} XP and moves you up the ladder.`,
    visual: <LadderSketch />,
  },
];

function Loop() {
  return (
    <section aria-labelledby="loop-title" className="relative mx-auto w-full max-w-6xl px-5 pt-20 sm:px-8 lg:pt-28">
      <div className="max-w-xl">
        <Eyebrow>How it works</Eyebrow>
        <SectionTitle id="loop-title">
          Three steps from wallet <span className="text-muted">to a name people trust.</span>
        </SectionTitle>
      </div>
      <ol className="mt-12 grid gap-4 md:grid-cols-3 md:gap-5">
        {STEPS.map((step, index) => (
          <li key={step.title} className="surface flex flex-col overflow-hidden">
            <div className="border-b border-line bg-[#08070b] p-5" aria-hidden="true">
              {step.visual}
            </div>
            <div className="flex flex-1 flex-col p-6">
              <span className="t-meta font-mono">0{index + 1}</span>
              <h3 className="t-h3 mt-3 text-[17px]">{step.title}</h3>
              <p className="t-body mt-2">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Schematic illustrations: shapes only, no invented names or numbers. Widths are fluid so they fit any column. */
function Line({ className }: { className: string }) {
  return <span className={`block h-2 rounded-full ${className}`} />;
}

function PassportSketch() {
  return (
    <div className="flex h-36 flex-col justify-center gap-4 rounded-2xl border border-line bg-elevated p-4">
      <div className="flex items-center gap-3">
        <span className="size-10 shrink-0 rounded-full bg-[linear-gradient(135deg,#8b5cf6,#241633)] ring-1 ring-line" />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Line className="w-[85%] max-w-28 bg-ink/80" />
          <Line className="w-[55%] max-w-16 bg-muted/50" />
        </div>
        <Badge tone="success" className="shrink-0">
          Signed
        </Badge>
      </div>
      <div className="flex gap-1.5">
        <span className="h-5 max-w-16 flex-[4] rounded-full bg-secondary ring-1 ring-line" />
        <span className="h-5 max-w-12 flex-[3] rounded-full bg-secondary ring-1 ring-line" />
        <span className="h-5 max-w-20 flex-[5] rounded-full bg-secondary ring-1 ring-line" />
      </div>
    </div>
  );
}

function BoardSketch() {
  return (
    <div className="flex h-36 flex-col justify-center gap-2">
      {["w-[90%]", "w-[65%]", "w-[78%]"].map((width, index) => (
        <div
          key={width}
          className={`flex items-center gap-3 rounded-xl border bg-elevated px-3 py-2.5 ${index === 0 ? "border-[#8b5cf6]/50" : "border-line"}`}
        >
          <span className="size-6 shrink-0 rounded-md bg-secondary ring-1 ring-line" />
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <Line className={`${width} max-w-32 bg-ink/70`} />
            <Line className="w-[45%] max-w-14 bg-muted/40" />
          </div>
          <Badge tone={index === 0 ? "info" : "success"} className="shrink-0">
            {index === 0 ? "Applied" : "Open"}
          </Badge>
        </div>
      ))}
    </div>
  );
}

function LadderSketch() {
  return (
    <div className="flex h-36 flex-col justify-center gap-2.5">
      {TIERS.map((tier, index) => (
        <div key={tier.name} className="flex items-center gap-2.5">
          <span className="w-[4.5rem] shrink-0 text-[11px] text-muted">{tier.name}</span>
          <span className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-secondary">
            <span
              className="block h-full rounded-full bg-[linear-gradient(90deg,#241633,#8b5cf6)]"
              style={{ width: `${Math.max(8, (index / (TIERS.length - 1)) * 100)}%` }}
            />
          </span>
          <span className="w-9 shrink-0 text-right font-mono text-[11px] text-muted tabular-nums">{tier.min}</span>
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Live data */

function Inside() {
  const { featured, leaders, stats } = Route.useLoaderData();
  const examplesOnly = featured.length > 0 && featured.every((item) => item.isDemo);

  return (
    <section aria-labelledby="inside-title" className="relative mx-auto w-full max-w-6xl px-5 pt-24 sm:px-8 lg:pt-32">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-xl">
          <Eyebrow>Inside the guild</Eyebrow>
          <SectionTitle id="inside-title">
            Live from the board <span className="text-muted">and the ladder.</span>
          </SectionTitle>
        </div>
        <Link to="/how-it-works" className="t-link w-fit text-sm">
          How XP is counted
        </Link>
      </div>

      <dl className="mt-12 grid grid-cols-2 border-y border-line md:grid-cols-4">
        {[
          ["Open opportunities", stats.openOpportunities],
          ["Passports", stats.passports],
          ["Accepted work", stats.acceptedWork],
          ["Onchain txs", stats.onchainTxs],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={
              "py-7 pr-2 md:px-6 " +
              (index % 2 === 1 ? "border-l border-line pl-5 md:pl-6 " : "") +
              (index >= 2 ? "border-t border-line md:border-t-0 " : "") +
              (index === 2 ? "md:border-l " : "")
            }
          >
            <dt className="t-meta">{label}</dt>
            <dd className="mt-3 text-[2.25rem] leading-none font-semibold tracking-[-0.04em] text-ink tabular-nums">
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
                    <span className="w-5 text-[13px] text-muted tabular-nums">{person.rank}</span>
                    <Avatar name={person.displayName} url={person.avatarUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] text-ink">{person.displayName}</span>
                      <TierBadge tier={person.tier} className="mt-1" />
                    </span>
                    <span className="text-sm text-ink tabular-nums">{formatXp(person.xp)} XP</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="flex flex-col items-start gap-5 px-3 py-6">
              <p className="t-body max-w-sm text-[15px]">
                Nobody is on the ladder yet. Save a Passport to join with {passportXp} XP, and accepted work takes the
                lead.
              </p>
              <Button asChild variant="secondary" size="compact">
                <Link to="/passport">Claim your spot</Link>
              </Button>
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
                    <span className="block truncate text-[15px] text-ink">{item.title}</span>
                    <span className="mt-0.5 block truncate text-[13px] text-muted">
                      {projectLabel(item.projectName)}
                      {item.isDemo ? " · Demo" : ""}
                    </span>
                  </span>
                  <span className="hidden shrink-0 text-right text-[13px] text-body sm:block">
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
    <section className="min-w-0 rounded-3xl border border-line bg-[#0a090d] p-3 sm:p-4">
      <div className="flex items-center justify-between px-3 pt-2 pb-3">
        <h3 className="text-[15px] font-medium tracking-tight text-ink">{title}</h3>
        <Link to={to} search={to === "/discover" ? emptyBoardSearch() : undefined} className="t-link text-[13px]">
          View all
        </Link>
      </div>
      <div className="border-t border-line pt-2">{children}</div>
    </section>
  );
}

/* ------------------------------------------------------------------ Two sides */

function Sides() {
  return (
    <section aria-labelledby="sides-title" className="relative mx-auto w-full max-w-6xl px-5 pt-24 pb-28 sm:px-8 lg:pt-32">
      <h2 id="sides-title" className="sr-only">
        Who Choguild is for
      </h2>
      <div className="grid gap-4 md:grid-cols-2 md:gap-5">
        <SideCard
          eyebrow="For contributors"
          title="Build a record people can check."
          points={["A public Passport with your skills and links", "Apply to open work in a few lines", "Accepted work counts toward your rank"]}
          action={
            <Button asChild>
              <Link to="/passport">Create your Passport</Link>
            </Button>
          }
        />
        <SideCard
          eyebrow="For publishers"
          title="Find people who have shipped."
          points={["Post work with clear scope and pay", "Review applications and evidence in one place", "Accept work to credit the contributor"]}
          action={
            <Button asChild variant="secondary">
              <Link to="/opportunities/new">Publish work</Link>
            </Button>
          }
        />
      </div>
    </section>
  );
}

function SideCard({ eyebrow, title, points, action }: { eyebrow: string; title: string; points: string[]; action: ReactNode }) {
  return (
    <div className="surface flex flex-col p-7 sm:p-9">
      <Eyebrow>{eyebrow}</Eyebrow>
      <h3 className="mt-4 text-2xl leading-tight font-semibold tracking-[-0.03em] text-ink">{title}</h3>
      <ul className="mt-6 flex flex-col gap-3">
        {points.map((point) => (
          <li key={point} className="t-body flex gap-3">
            <Check className="mt-0.5 size-4 shrink-0 text-[#a78bfa]" aria-hidden="true" />
            {point}
          </li>
        ))}
      </ul>
      <div className="mt-8">{action}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ Footer */

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <img src="/brand/choguild-mark.jpg" alt="" width={28} height={28} className="size-7 rounded-lg" />
          <span className="text-sm text-body">Choguild · Built on Monad</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted">
          <Link to="/discover" search={emptyBoardSearch()} className="hover:text-ink">
            Discover
          </Link>
          <Link to="/ranking" className="hover:text-ink">
            Ranking
          </Link>
          <Link to="/how-it-works" className="hover:text-ink">
            How it works
          </Link>
          <Link to="/network" className="hover:text-ink">
            Network
          </Link>
        </nav>
      </div>
    </footer>
  );
}
