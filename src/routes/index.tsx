import { Link, createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AnimatedMark } from "@/components/brand/animated-mark";
import { Reveal, WordReveal } from "@/components/fx/reveal";
import { PosterMark } from "@/components/board/opportunity-card";
import { Avatar, RankMedal } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
import { listBoard } from "@/lib/board/functions";
import { COMPENSATION_LABEL, type CompensationType } from "@/lib/board/copy";
import { projectLabel } from "@/lib/board/display";
import { emptyBoardSearch } from "@/lib/board/search";
import { getPassportState } from "@/lib/passport/functions";
import { getRanking } from "@/lib/ranking/functions";
import { formatXp, rankContributors } from "@/lib/ranking/xp";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [passport, board, ranking] = await Promise.all([
      getPassportState(),
      listBoard({ data: { ...emptyBoardSearch(), page: 1 } }),
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
  head: () => seo({ title: "Choguild · Get work and earn your rank", description: "Find work, prove it, climb the ladder. The contributor guild on Monad.", path: "/" }),
  component: HomePage,
});

const STEPS: { label: string; body: string; to: "/passport" | "/discover" | "/submissions" | "/ranking" }[] = [
  { label: "Identity", body: "Sign once and save a public passport.", to: "/passport" },
  { label: "Opportunities", body: "Browse open work from passport holders.", to: "/discover" },
  { label: "Submissions", body: "Deliver and submit evidence for review.", to: "/submissions" },
  { label: "Reputation", body: "Accepted work earns XP and rank.", to: "/ranking" },
];

function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <Hero />
      <Bento />
    </div>
  );
}

function Hero() {
  const { profile } = Route.useLoaderData();

  return (
    <section aria-labelledby="hero-title" className="relative flex flex-col items-center pt-20 pb-20 text-center sm:pt-28 lg:pt-32">
      <HeroBackdrop />
      <div className="hero-parallax-text relative flex flex-col items-center">
        <div className="mark-spin-in">
          <MarkOrbit />
        </div>
        <p
          style={{ animationDelay: "100ms" }}
          className="fade-up mt-8 inline-flex items-center gap-2 rounded-full border border-line-strong bg-elevated/70 px-3.5 py-1.5 text-label text-body"
        >
          <span className="pulse-dot" aria-hidden="true" />
          The contributor guild on Monad
        </p>
        <h1 id="hero-title" className="t-display mt-7 max-w-[12ch] text-balance">
          <WordReveal
            delay={0.1}
            wrap
            lines={[["Get", "work", "and", "earn", "your", <em key="r">rank.</em>]]}
          />
        </h1>
        <p className="fade-up mt-6 text-lead text-body" style={{ animationDelay: "350ms" }}>
          Find work, prove it, climb the ladder.
        </p>
        <div
          style={{ animationDelay: "450ms" }}
          className="fade-up mt-9 flex w-full flex-col gap-2.5 min-[420px]:w-auto min-[420px]:flex-row"
        >
          <Link
            to="/discover"
            search={emptyBoardSearch()}
            className="sheen btn-glass group inline-flex h-12 items-center justify-center gap-3 rounded-full px-7 text-base font-medium text-on-accent"
          >
            Explore opportunities
            <span aria-hidden="true" className="arrow-slide">→</span>
          </Link>
          <Link
            to="/passport"
            className="inline-flex h-12 items-center justify-center rounded-full border border-line-strong bg-elevated/60 px-7 text-base text-ink transition-colors hover:border-ink/30"
          >
            {profile ? "Open your passport" : "Create your passport"}
          </Link>
        </div>
      </div>
    </section>
  );
}

/** The logo mark with two slow orbits and a satellite: the hero's visual. */
function MarkOrbit() {
  return (
    <div className="float-y relative size-28 sm:size-32" aria-hidden="true">
      <svg viewBox="0 0 100 100" className="orbit absolute inset-0 size-full">
        <circle cx="50" cy="50" r="48" fill="none" stroke="rgb(228 222 255 / 0.12)" strokeDasharray="1 5" />
        <circle cx="50" cy="2" r="2" fill="#836ef9" />
      </svg>
      <svg viewBox="0 0 100 100" className="orbit-rev absolute inset-3 size-[calc(100%-1.5rem)]">
        <circle cx="50" cy="50" r="47" fill="none" stroke="rgb(228 222 255 / 0.08)" />
        <circle cx="97" cy="50" r="1.6" fill="rgb(228 222 255 / 0.6)" />
      </svg>
      <div className="absolute inset-7 flex items-center justify-center rounded-full border border-line-strong bg-elevated/80 sm:inset-8">
        <AnimatedMark size={40} className="text-ink" />
      </div>
    </div>
  );
}

/** Full-bleed topographic image behind the hero: slow drift, scroll parallax, drifting light, a scrim. */
function HeroBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute -top-24 bottom-0 left-1/2 w-screen -translate-x-1/2 overflow-hidden">
      <div className="hero-parallax-bg absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" type="image/avif" srcSet="/bg/hero-desktop.avif" />
          <source media="(min-width: 768px)" type="image/webp" srcSet="/bg/hero-desktop.webp" />
          <source type="image/avif" srcSet="/bg/hero-mobile.avif" />
          <img src="/bg/hero-mobile.webp" alt="" fetchPriority="high" decoding="async" className="hero-img absolute inset-0 size-full object-cover object-[60%_30%] md:object-[72%_45%]" />
        </picture>
        <div className="hero-light absolute top-[5%] left-1/2 size-[50vmax] -translate-x-1/2 rounded-full" />
        <div className="hero-light-2 absolute top-[30%] left-[5%] size-[40vmax] rounded-full" />
      </div>
      <div className="absolute inset-0 bg-[radial-gradient(60%_55%_at_50%_45%,rgb(5_5_7/0.7),rgb(5_5_7/0.25)_70%,rgb(5_5_7/0.1))]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,#050507,transparent)]" />
    </div>
  );
}

function Bento() {
  const { stats, leaders, featured } = Route.useLoaderData();
  const cells = [
    ["Open work", stats.openOpportunities],
    ["Passports", stats.passports],
    ["Accepted", stats.acceptedWork],
    ["Onchain txs", stats.onchainTxs],
  ] as const;

  return (
    <section aria-label="Inside the guild" className="grid grid-cols-1 gap-3 md:grid-cols-6 lg:grid-cols-12">
      {/* Live stats */}
      <Reveal className="bento flex flex-col p-6 sm:p-8 md:col-span-6 lg:col-span-7">
        <CardHead label="Live" title="The guild, right now." />
        <dl className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {cells.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-line bg-canvas/50 p-4">
              <dt className="text-label text-muted">{label}</dt>
              <dd className="t-stat mt-3 tabular-nums">
                {value === null ? <span className="text-body text-base">unavailable</span> : <CountUp value={Number(value)} />}
              </dd>
            </div>
          ))}
        </dl>
        <div className="mt-auto pt-6">
          <Ticker stats={stats} titles={featured.map((item) => item.title)} />
        </div>
      </Reveal>

      {/* How it works */}
      <Reveal delay={0.06} className="bento p-6 sm:p-8 md:col-span-6 lg:col-span-5">
        <CardHead label="The loop" title={<>Four steps to <em>rank.</em></>} to="/how-it-works" cta="Details" />
        <ol className="mt-6 flex flex-col gap-1.5">
          {STEPS.map((step, index) => (
            <li key={step.label}>
              <Link
                to={step.to}
                search={step.to === "/discover" ? emptyBoardSearch() : step.to === "/submissions" ? { view: "mine", status: "all" } : undefined}
                className="group flex items-center gap-4 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full border border-line-strong text-small font-semibold text-ink transition-colors group-hover:border-signal group-hover:bg-signal-solid group-hover:text-on-accent">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-base font-medium text-ink">{step.label}</span>
                  <span className="block text-small text-pretty text-muted">{step.body}</span>
                </span>
                <span aria-hidden="true" className="arrow-slide text-muted">→</span>
              </Link>
            </li>
          ))}
        </ol>
      </Reveal>

      {/* Ladder preview */}
      <Reveal delay={0.04} className="bento p-6 sm:p-8 md:col-span-3 lg:col-span-5">
        <CardHead label="Ranking" title="Top of the ladder." to="/ranking" cta="Full ranking" />
        {leaders.length > 0 ? (
          <ol className="mt-6 flex flex-col gap-1">
            {leaders.map((person) => (
              <li key={person.username}>
                <Link to="/passport/$username" params={{ username: person.username }} className="flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors hover:bg-white/[0.04]">
                  <RankMedal rank={person.rank} />
                  <Avatar name={person.displayName} url={person.avatarUrl} />
                  <span className="min-w-0 flex-1 truncate text-base text-ink">{person.displayName}</span>
                  <span className="text-small font-medium tabular-nums text-body">{formatXp(person.xp)} XP</span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyPreview body="Nobody has claimed first place yet." to="/passport" cta="Claim your spot" />
        )}
      </Reveal>

      {/* Open work preview */}
      <Reveal delay={0.08} className="bento p-6 sm:p-8 md:col-span-3 lg:col-span-7">
        <CardHead label="The board" title="Open work." to="/discover" cta="All work" />
        {featured.length > 0 ? (
          <ul className={"mt-6 grid gap-2" + (featured.length > 1 ? " sm:grid-cols-2" : "")}>
            {featured.map((item) => (
              <li key={item.id}>
                <Link to="/discover/$opportunityId" params={{ opportunityId: item.id }} className="group flex h-full flex-col gap-4 rounded-2xl border border-line bg-canvas/50 p-4 transition-colors hover:border-line-strong">
                  <span className="flex items-center gap-2.5">
                    <PosterMark name={item.poster.displayName || item.poster.username || projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} avatarUrl={item.poster.avatarUrl} />
                    <span className="truncate text-label text-muted">{projectLabel(item.projectName)}</span>
                  </span>
                  <span className="t-h3 text-ink group-hover:text-signal">{item.title}</span>
                  <span className="mt-auto text-label text-body">
                    {COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyPreview body="Listings appear the moment a passport holder publishes one." to="/opportunities/new" cta="Publish the first listing" />
        )}
      </Reveal>

      {/* CTA */}
      <Reveal className="bento flex flex-col items-start justify-between gap-6 p-6 sm:p-8 md:col-span-6 md:flex-row md:items-center lg:col-span-12">
        <p className="t-h2 max-w-xl">
          One passport. Every piece of work, <em>on the record.</em>
        </p>
        <Link to="/passport" className="sheen btn-glass group inline-flex h-12 shrink-0 items-center gap-3 rounded-full px-7 text-base font-medium text-on-accent">
          Get your passport <span aria-hidden="true" className="arrow-slide">→</span>
        </Link>
      </Reveal>
    </section>
  );
}

function CardHead({ label, title, to, cta }: { label: string; title: ReactNode; to?: "/ranking" | "/discover" | "/how-it-works"; cta?: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="flex items-center gap-2 text-label text-muted">
          <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
          {label}
        </p>
        <h2 className="t-h2 mt-3">{title}</h2>
      </div>
      {to && cta ? (
        <Link to={to} search={to === "/discover" ? emptyBoardSearch() : undefined} className="shrink-0 rounded-full border border-line px-3 py-1.5 text-label text-body transition-colors hover:border-line-strong hover:text-ink">
          {cta}
        </Link>
      ) : null}
    </div>
  );
}

function EmptyPreview({ body, to, cta }: { body: string; to: "/passport" | "/opportunities/new"; cta: string }) {
  return (
    <div className="mt-6 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-line-strong p-5 sm:p-6">
      <AnimatedMark size={36} className="text-ink" />
      <p className="text-base text-body">{body}</p>
      <Link to={to} className="rounded-full bg-white/[0.06] px-4 py-2 text-small text-ink transition-colors hover:bg-white/[0.1]">
        {cta} →
      </Link>
    </div>
  );
}

function Ticker({ stats, titles }: { stats: { openOpportunities: number; passports: number; acceptedWork: number; onchainTxs: number | null }; titles: string[] }) {
  const empty =
    titles.length === 0 && stats.openOpportunities + stats.passports + stats.acceptedWork + (stats.onchainTxs ?? 0) === 0;
  // Nothing real to show yet: no ticker rather than a reel of zeros.
  if (empty) return null;
  const items = [
    `${formatXp(stats.openOpportunities)} open`,
    `${formatXp(stats.passports)} passports`,
    `${formatXp(stats.acceptedWork)} accepted`,
    stats.onchainTxs === null ? "Onchain txs unavailable" : `${formatXp(stats.onchainTxs)} onchain txs`,
    ...titles.map((title) => `Open: ${title}`),
    "Live from the database and Monad mainnet",
  ];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-5 pr-5 text-label whitespace-nowrap text-body">
          <span className="text-signal" aria-hidden="true">◆</span>
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="ticker relative mt-4 overflow-hidden rounded-full py-2.5">
      <div className="ticker-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
