import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, BadgeCheck, Compass, FileCheck2, IdCard, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { AnimatedMark } from "@/components/brand/animated-mark";
import { LogoMark } from "@/components/brand/logo";
import { Magnetic } from "@/components/fx/magnetic";
import { Reveal, WordReveal } from "@/components/fx/reveal";
import { ProjectMark } from "@/components/board/opportunity-card";
import { Avatar, RankMedal, TierBadge } from "@/components/ranking/bits";
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
const STEPS: { label: string; body: string; to: "/passport" | "/discover" | "/submissions" | "/ranking"; icon: LucideIcon }[] = [
  { label: "Identity", body: "Sign once with your wallet and save a public passport.", to: "/passport", icon: IdCard },
  { label: "Opportunities", body: "Browse open work from other passport holders.", to: "/discover", icon: Compass },
  { label: "Submissions", body: "Deliver the work and submit evidence for review.", to: "/submissions", icon: FileCheck2 },
  { label: "Reputation", body: "Accepted work earns XP and moves you up the ladder.", to: "/ranking", icon: BadgeCheck },
];

function HomePage() {
  return (
    <>
      <Hero />
      <Steps />
      <Inside />
      <Footer />
    </>
  );
}

const HEADLINE = "Get work and earn your rank.";

function Hero() {
  const { profile, stats } = Route.useLoaderData();

  return (
    <section aria-labelledby="hero-title" className="relative isolate">
      <div className="relative mx-auto flex max-w-5xl flex-col items-center px-5 pt-20 pb-16 text-center sm:px-8 sm:pt-28 lg:pt-32">
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          <Link
            to="/how-it-works"
            className="group inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.03] py-1.5 pr-3.5 pl-2 text-[13px] text-body backdrop-blur transition-colors hover:border-white/20 hover:text-ink"
          >
            <span className="flex size-5 items-center justify-center rounded-full bg-white/[0.06]">
              <LogoMark className="size-3.5 text-ink" />
            </span>
            The contributor guild on Monad
            <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </motion.div>

        <h1
          id="hero-title"
          className="mt-8 max-w-[12ch] text-[clamp(2.9rem,1.4rem+5.6vw,6rem)] lg:max-w-[18ch] leading-[1.02] font-semibold tracking-[-0.05em] text-balance text-ink"
        >
          <WordReveal
            delay={0.15}
            wrap
            lines={[HEADLINE.split(" ")]}
          />
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.65 }}
          className="mt-7 max-w-[34rem] text-[16px] leading-7 text-balance text-body sm:text-[18px] sm:leading-8"
        >
          Find work, prove it, climb the ladder.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.8 }}
          className="mt-10 flex w-full flex-col items-stretch justify-center gap-3 min-[420px]:w-auto min-[420px]:flex-row min-[420px]:items-center"
        >
          <Magnetic className="flex">
            <Link
              to="/discover"
              search={emptyBoardSearch()}
              className="btn-accent btn-glow group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full px-6 text-[15px] font-medium text-white"
            >
              Explore opportunities
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </Link>
          </Magnetic>
          <Link
            to="/passport"
            className="inline-flex h-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-6 text-[15px] font-medium text-ink backdrop-blur transition-all hover:-translate-y-px hover:border-white/20 hover:bg-white/[0.06]"
          >
            {profile ? "Open your Passport" : "Create your Passport"}
          </Link>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 1 }}
          className="surface mt-16 grid w-full max-w-3xl grid-cols-2 overflow-hidden rounded-2xl sm:mt-20 md:grid-cols-4"
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
                "px-5 py-5 text-left sm:px-6 " +
                (index % 2 === 1 ? "border-l border-line " : "") +
                (index >= 2 ? "border-t border-line md:border-t-0 " : "") +
                (index === 2 ? "md:border-l " : "")
              }
            >
              <dt className="text-[12px] tracking-wide text-muted uppercase">{label}</dt>
              <dd className="mt-2 text-[1.75rem] leading-none font-semibold tracking-[-0.04em] text-ink tabular-nums">
                <CountUp value={Number(value)} />
              </dd>
            </div>
          ))}
        </motion.dl>
        <p className="mt-3 text-[12px] text-muted">Live from the database and Monad mainnet.</p>
      </div>
    </section>
  );
}

function SectionHead({ eyebrow, title, aside }: { eyebrow: string; title: string; aside?: ReactNode }) {
  return (
    <Reveal className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        <p className="text-[12px] font-medium tracking-[0.18em] text-muted uppercase">{eyebrow}</p>
        <h2 className="mt-4 text-ink text-[clamp(1.9rem,1.2rem+2.2vw,2.9rem)] leading-[1.04] font-semibold tracking-[-0.045em]">
          {title}
        </h2>
      </div>
      {aside}
    </Reveal>
  );
}

function Steps() {
  return (
    <section aria-label="How the guild works" className="mx-auto w-full max-w-6xl px-5 pt-16 sm:px-8 lg:pt-24">
      <SectionHead
        eyebrow="How it works"
        title="One record, from identity to accepted work."
        aside={
          <Link to="/how-it-works" className="text-[14px] text-body underline-offset-4 hover:text-ink hover:underline">
            The full loop and XP table
          </Link>
        }
      />
      <ol className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          return (
            <Reveal as="li" key={step.label} delay={index * 0.08}>
              <Link
                to={step.to}
                search={step.to === "/discover" ? emptyBoardSearch() : undefined}
                className="surface spotlight card-pop group flex h-full flex-col gap-10 p-6"
              >
                <span className="flex items-center justify-between">
                  <span className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                    <Icon className="size-[18px] text-ink" aria-hidden="true" />
                  </span>
                  <span className="font-mono text-[12px] text-muted">0{index + 1}</span>
                </span>
                <span>
                  <span className="block text-[16px] font-semibold tracking-[-0.02em] text-ink">{step.label}</span>
                  <span className="mt-2 block text-[14px] leading-6 text-body">{step.body}</span>
                </span>
              </Link>
            </Reveal>
          );
        })}
      </ol>
    </section>
  );
}

function Inside() {
  const { featured, leaders } = Route.useLoaderData();

  return (
    <section aria-labelledby="inside-title" className="relative mx-auto w-full max-w-6xl px-5 pt-24 pb-24 sm:px-8 lg:pt-32">
      <SectionHead eyebrow="Inside the guild" title="Live from the board and the ladder." />

      <div className="mt-12 grid grid-cols-[minmax(0,1fr)] items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:gap-6">
        <Reveal>
          <Panel title="Top of the ladder" to="/ranking">
            {leaders.length > 0 ? (
              <ol className="flex flex-col">
                {leaders.map((person) => (
                  <li key={person.username}>
                    <Link
                      to="/passport/$username"
                      params={{ username: person.username }}
                      className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.04]"
                    >
                      <RankMedal rank={person.rank} />
                      <Avatar name={person.displayName} url={person.avatarUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-ink">{person.displayName}</span>
                        <TierBadge tier={person.tier} className="mt-1" />
                      </span>
                      <span className="text-[14px] tabular-nums text-ink">{formatXp(person.xp)} XP</span>
                    </Link>
                  </li>
                ))}
              </ol>
            ) : (
              <InlineEmpty
                body="Nobody has claimed the top spot yet. The first passport with accepted work leads the ladder."
                to="/passport"
                cta="Claim your spot"
              />
            )}
          </Panel>
        </Reveal>

        <Reveal delay={0.08}>
          <Panel title="Open on the board" to="/discover">
            {featured.length === 0 ? (
              <InlineEmpty
                body="No open work yet. Listings appear here the moment a passport holder publishes one."
                to="/opportunities/new"
                cta="Publish the first listing"
              />
            ) : (
              <ul className="flex flex-col">
                {featured.map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/discover/$opportunityId"
                      params={{ opportunityId: item.id }}
                      className="flex items-center gap-4 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.04]"
                    >
                      <ProjectMark name={projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[15px] text-ink">{item.title}</span>
                        <span className="mt-0.5 block truncate text-[13px] text-muted">{projectLabel(item.projectName)}</span>
                      </span>
                      <span className="hidden shrink-0 text-right text-[13px] text-body sm:block">
                        {COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </Reveal>
      </div>
    </section>
  );
}

function InlineEmpty({ body, to, cta }: { body: string; to: "/passport" | "/opportunities/new"; cta: string }) {
  return (
    <div className="flex items-center gap-5 px-3 py-6">
      <AnimatedMark size={64} className="shrink-0 text-ink" />
      <div className="flex flex-col items-start gap-4">
        <p className="max-w-sm text-[14px] leading-6 text-body">{body}</p>
        <Link
          to={to}
          className="inline-flex h-9 items-center rounded-full border border-white/10 bg-white/[0.03] px-4 text-[13px] text-ink transition-all hover:-translate-y-px hover:border-white/20"
        >
          {cta}
        </Link>
      </div>
    </div>
  );
}

function Panel({ title, to, children }: { title: string; to: "/ranking" | "/discover"; children: ReactNode }) {
  return (
    <section className="surface spotlight min-w-0 p-3 sm:p-4">
      <div className="flex items-center justify-between px-3 pt-2 pb-3">
        <h3 className="text-[15px] font-medium tracking-tight text-ink">{title}</h3>
        <Link
          to={to}
          search={to === "/discover" ? emptyBoardSearch() : undefined}
          className="text-[13px] text-body underline-offset-4 hover:text-ink hover:underline"
        >
          View all
        </Link>
      </div>
      <div className="border-t border-line pt-2">{children}</div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div className="flex items-center gap-3">
          <LogoMark className="size-5 text-ink" />
          <span className="text-[14px] text-body">Choguild · Built on Monad</span>
        </div>
        <nav aria-label="Footer" className="flex flex-wrap gap-x-6 gap-y-3 text-[14px] text-muted">
          <Link to="/how-it-works" className="hover:text-ink">How it works</Link>
          <Link to="/ranking" className="hover:text-ink">Ranking</Link>
          <Link to="/network" className="hover:text-ink">Network</Link>
        </nav>
      </div>
    </footer>
  );
}
