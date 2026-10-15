import { Link, createFileRoute } from "@tanstack/react-router";
import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef, type ReactNode } from "react";
import { AnimatedMark } from "@/components/brand/animated-mark";
import { Reveal, WordReveal } from "@/components/fx/reveal";
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
  head: () => ({ meta: [{ title: "Choguild · The contributor ecosystem on Monad" }] }),
  component: HomePage,
});

/** The loop, in order. Real product concepts, not endorsements. */
const STEPS: { label: string; body: string; to: "/passport" | "/discover" | "/submissions" | "/ranking" }[] = [
  { label: "Identity", body: "Sign once with your wallet and save a public passport.", to: "/passport" },
  { label: "Opportunities", body: "Browse open work from other passport holders.", to: "/discover" },
  { label: "Submissions", body: "Deliver the work and submit evidence for review.", to: "/submissions" },
  { label: "Reputation", body: "Accepted work earns XP and moves you up the ladder.", to: "/ranking" },
];

const HEADLINE = "Get work and earn your rank.";
const EASE = [0.22, 1, 0.36, 1] as const;

function HomePage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-5 sm:px-8">
      <Hero />
      <Steps />
      <Ladder />
      <Board />
    </div>
  );
}

function Hero() {
  const { profile, stats, featured } = Route.useLoaderData();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "22%"]);
  const bgOpacity = useTransform(scrollYProgress, [0, 0.9], [1, 0.25]);
  const textY = useTransform(scrollYProgress, [0, 1], ["0%", "-12%"]);

  return (
    <section ref={ref} aria-labelledby="hero-title" className="relative pt-16 sm:pt-24 lg:pt-28">
      <HeroBackdrop y={bgY} opacity={bgOpacity} />
      <motion.div style={{ y: textY }} className="relative">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="relative flex items-center justify-between border-b border-line pb-4"
      >
        <p className="t-eyebrow flex items-center gap-2.5">
          <span className="pulse-dot" aria-hidden="true" />
          The contributor guild on Monad
        </p>
        <p className="t-eyebrow hidden sm:block">Est. 2026 · Index 001</p>
      </motion.div>
      <div className="relative -mt-px h-px overflow-hidden" aria-hidden="true">
        <span className="accent-line absolute inset-y-0 left-0 w-40 bg-signal" />
      </div>

      <h1
        id="hero-title"
        className="t-display mt-10 max-w-[13ch] text-[clamp(2.75rem,1.4rem+5.6vw,6.25rem)] leading-[1] tracking-[-0.05em] text-balance sm:mt-14"
      >
        <WordReveal delay={0.1} wrap lines={[HEADLINE.split(" ")]} />
      </h1>

      <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.7 }}
          className="text-[19px] leading-[1.5] text-body sm:text-[22px] lg:col-span-5 lg:col-start-1"
        >
          Find work, prove it, climb the ladder.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE, delay: 0.85 }}
          className="flex flex-col gap-2.5 min-[420px]:flex-row lg:col-span-6 lg:col-start-7 lg:justify-end"
        >
          <Link
            to="/discover"
            search={emptyBoardSearch()}
            className="sheen group inline-flex h-12 items-center justify-between gap-6 rounded-full bg-signal px-6 text-[15px] font-medium text-on-accent transition-colors hover:bg-[#ff7f58]"
          >
            Explore opportunities
            <span aria-hidden="true" className="arrow-slide">→</span>
          </Link>
          <Link
            to="/passport"
            className="group inline-flex h-12 items-center justify-between gap-6 rounded-full border border-line-strong bg-canvas/40 px-6 text-[15px] text-ink transition-colors hover:border-ink/40 hover:bg-elevated"
          >
            {profile ? "Open your passport" : "Create your passport"}
            <span aria-hidden="true" className="arrow-slide text-muted">→</span>
          </Link>
        </motion.div>
      </div>
      </motion.div>

      <motion.dl
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
        className="relative mt-20 grid grid-cols-2 overflow-hidden rounded-[1.25rem] border border-line bg-elevated/70 md:grid-cols-4 lg:mt-28"
      >
        {[
          ["Open work", stats.openOpportunities],
          ["Passports", stats.passports],
          ["Accepted", stats.acceptedWork],
          ["Onchain txs", stats.onchainTxs],
        ].map(([label, value], index) => (
          <div
            key={label}
            className={
              "px-5 py-6 sm:px-6 " +
              (index % 2 === 1 ? "border-l border-line " : "") +
              (index >= 2 ? "border-t border-line md:border-t-0 " : "") +
              (index === 2 ? "md:border-l " : "")
            }
          >
            <dt className="text-[13px] text-muted">
              {label}
            </dt>
            <dd className="t-display mt-3 text-[clamp(2rem,1.5rem+1.8vw,3rem)] leading-none tabular-nums">
              <CountUp value={Number(value)} />
            </dd>
          </div>
        ))}
      </motion.dl>
      <Ticker stats={stats} titles={featured.map((item) => item.title)} />
    </section>
  );
}

/** Full-bleed topographic image behind the hero: slow drift, scroll parallax, a drifting light, and a scrim for legibility. */
function HeroBackdrop({ y, opacity }: { y: MotionValue<string>; opacity: MotionValue<number> }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-1/2 -z-0 w-screen -translate-x-1/2 overflow-hidden">
      <motion.div style={{ y, opacity }} className="absolute inset-0">
        <picture>
          <source media="(min-width: 768px)" type="image/avif" srcSet="/bg/hero-desktop.avif" />
          <source media="(min-width: 768px)" type="image/webp" srcSet="/bg/hero-desktop.webp" />
          <source type="image/avif" srcSet="/bg/hero-mobile.avif" />
          <img
            src="/bg/hero-mobile.webp"
            alt=""
            fetchPriority="high"
            decoding="async"
            className="hero-img absolute inset-0 size-full object-cover object-[70%_30%] md:object-[70%_40%]"
          />
        </picture>
        <div className="hero-light absolute top-[10%] right-[8%] size-[46vmax] rounded-full" />
        <div className="hero-light-2 absolute top-[30%] left-[10%] size-[40vmax] rounded-full" />
      </motion.div>
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgb(11_11_10/0.82)_0%,rgb(11_11_10/0.45)_55%,rgb(11_11_10/0.1)_100%)]" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-[linear-gradient(to_top,#0b0b0a,transparent)]" />
    </div>
  );
}

/** A live ticker: real counts and the titles of real open work. Hidden entirely if there is nothing to say. */
function Ticker({ stats, titles }: { stats: { openOpportunities: number; passports: number; acceptedWork: number; onchainTxs: number }; titles: string[] }) {
  const items = [
    `${formatXp(stats.openOpportunities)} open`,
    `${formatXp(stats.passports)} passports`,
    `${formatXp(stats.acceptedWork)} accepted`,
    `${formatXp(stats.onchainTxs)} onchain txs`,
    ...titles.map((title) => `Open — ${title}`),
    "Live from the database and Monad mainnet",
  ];
  const row = (hidden: boolean) => (
    <ul className="flex shrink-0 items-center" aria-hidden={hidden || undefined}>
      {items.map((item, index) => (
        <li key={index} className="flex items-center gap-6 pr-6 text-[13px] whitespace-nowrap text-body">
          <span className="text-signal" aria-hidden="true">◆</span>
          {item}
        </li>
      ))}
    </ul>
  );
  return (
    <div className="ticker relative mt-4 overflow-hidden rounded-full border border-line bg-elevated/70 py-3">
      <div className="ticker-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

function SectionHead({ label, title, aside }: { index?: string; label: string; title: string; aside?: ReactNode }) {
  return (
    <Reveal className="grid gap-5 border-t border-line-strong pt-6 lg:grid-cols-12">
      <p className="t-eyebrow flex items-center gap-2 lg:col-span-3">
        <span className="size-1.5 rounded-full bg-signal" aria-hidden="true" />
        {label}
      </p>
      <h2 className="t-h2 max-w-[18ch] lg:col-span-6">{title}</h2>
      {aside ? <div className="lg:col-span-3 lg:text-right">{aside}</div> : null}
    </Reveal>
  );
}

function Steps() {
  return (
    <section aria-label="How the guild works" className="pt-32 lg:pt-44">
      <SectionHead
        index="01"
        label="The loop"
        title="One record, from identity to accepted work."
        aside={
          <Link to="/how-it-works" className="t-link text-[14px]">
            The full loop and XP table
          </Link>
        }
      />
      <ol className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => (
          <Reveal as="li" key={step.label} delay={index * 0.08} className="h-full">
            <Link
              to={step.to}
              search={step.to === "/discover" ? emptyBoardSearch() : undefined}
              className="surface group flex h-full flex-col justify-between gap-14 p-6 transition-[border-color,transform] duration-300 hover:-translate-y-0.5 hover:border-line-strong"
            >
              <span className="flex items-baseline justify-between">
                <span className="t-display text-[2.5rem] leading-none text-faint transition-colors duration-300 group-hover:text-signal">
                  {index + 1}
                </span>
                <span aria-hidden="true" className="arrow-slide text-muted group-hover:text-ink">→</span>
              </span>
              <span>
                <span className="block text-[16px] font-medium text-ink">{step.label}</span>
                <span className="mt-2 block max-w-[26ch] text-[14px] leading-6 text-body">{step.body}</span>
              </span>
            </Link>
          </Reveal>
        ))}
      </ol>
    </section>
  );
}

function Ladder() {
  const { leaders } = Route.useLoaderData();

  return (
    <section aria-label="Top of the ladder" className="pt-32 lg:pt-44">
      <SectionHead
        index="02"
        label="The ladder"
        title="Rank is earned, one accepted piece of work at a time."
        aside={<Link to="/ranking" className="t-link text-[14px]">Full ranking</Link>}
      />
      <div className="mt-14 lg:ml-[25%]">
        {leaders.length > 0 ? (
          <ol className="panel">
            {leaders.map((person, index) => (
              <Reveal as="li" key={person.username} delay={index * 0.05} className="border-b border-line">
                <Link
                  to="/passport/$username"
                  params={{ username: person.username }}
                  className="row-link group grid grid-cols-[2.5rem_auto_minmax(0,1fr)_auto] items-center gap-4 py-4"
                >
                  <span className={"t-display text-[1.25rem] leading-none tabular-nums " + (person.rank === 1 ? "text-signal" : "text-faint")}>
                    {person.rank}
                  </span>
                  <Avatar name={person.displayName} url={person.avatarUrl} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-ink">{person.displayName}</span>
                    <span className="block truncate font-mono text-[11px] text-muted">@{person.username}</span>
                  </span>
                  <span className="flex items-center gap-4">
                    <TierBadge tier={person.tier} className="hidden sm:inline-flex" />
                    <span className="font-mono text-[13px] tabular-nums text-ink">{formatXp(person.xp)} XP</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ol>
        ) : (
          <InlineEmpty
            title="The top spot is open."
            body="The first passport with accepted work leads the ladder."
            to="/passport"
            cta="Claim your spot"
          />
        )}
      </div>
    </section>
  );
}

function Board() {
  const { featured } = Route.useLoaderData();

  return (
    <section aria-label="Open on the board" className="pt-32 lg:pt-44">
      <SectionHead
        index="03"
        label="The board"
        title="Open work from passport holders."
        aside={
          <Link to="/discover" search={emptyBoardSearch()} className="t-link text-[14px]">
            Everything on the board
          </Link>
        }
      />
      <div className="mt-14 lg:ml-[25%]">
        {featured.length === 0 ? (
          <InlineEmpty
            title="The board is empty."
            body="Listings appear here the moment a passport holder publishes one."
            to="/opportunities/new"
            cta="Publish the first listing"
          />
        ) : (
          <ul className="panel">
            {featured.map((item, index) => (
              <Reveal as="li" key={item.id} delay={index * 0.05} className="border-b border-line">
                <Link
                  to="/discover/$opportunityId"
                  params={{ opportunityId: item.id }}
                  className="row-link group grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 py-4"
                >
                  <ProjectMark name={projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} />
                  <span className="min-w-0">
                    <span className="block truncate text-[15px] text-ink transition-colors group-hover:text-signal">{item.title}</span>
                    <span className="block truncate font-mono text-[11px] text-muted">{projectLabel(item.projectName)}</span>
                  </span>
                  <span className="flex items-center gap-4 text-[13px] text-body">
                    <span className="hidden sm:inline">
                      {COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}
                    </span>
                    <span aria-hidden="true" className="arrow-slide text-muted">→</span>
                  </span>
                </Link>
              </Reveal>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function InlineEmpty({ title, body, to, cta }: { title: string; body: string; to: "/passport" | "/opportunities/new"; cta: string }) {
  return (
    <Reveal className="surface flex flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:px-8">
      <AnimatedMark size={48} className="shrink-0 text-ink" />
      <div className="flex-1">
        <p className="text-[1.25rem] font-semibold tracking-[-0.025em] text-ink">{title}</p>
        <p className="mt-1.5 max-w-sm text-[14px] leading-6 text-body">{body}</p>
      </div>
      <Link
        to={to}
        className="group inline-flex h-10 items-center gap-4 self-start rounded-full border border-line-strong px-4 text-[14px] text-ink transition-colors hover:border-ink/40 sm:self-auto"
      >
        {cta}
        <span aria-hidden="true" className="arrow-slide">→</span>
      </Link>
    </Reveal>
  );
}
