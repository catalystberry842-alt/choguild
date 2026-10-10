import { Link, createFileRoute } from "@tanstack/react-router";
import { ArrowRight, Compass, IdCard, ScrollText, Sparkles, Trophy } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Avatar, TierBadge } from "@/components/ranking/bits";
import { CountUp } from "@/components/ranking/count-up";
import { getRanking } from "@/lib/ranking/functions";
import { TIERS, formatXp } from "@/lib/ranking/xp";
import { OpportunityCardView } from "@/components/board/opportunity-card";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { listBoard } from "@/lib/board/functions";
import { emptyBoardSearch } from "@/lib/board/search";
import { completionSummary, profileCompletion } from "@/lib/passport/completion";
import { getPassportState } from "@/lib/passport/functions";
import { shortAddress } from "@/lib/passport/format";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [passport, board, ranking] = await Promise.all([
      getPassportState(),
      listBoard({ data: { ...emptyBoardSearch(), status: "all", page: 1 } }),
      getRanking(),
    ]);
    return { ...passport, featured: board.items.slice(0, 2), leaders: ranking.ranking.slice(0, 3), stats: ranking.stats };
  },
  staticData: { title: "Home" },
  head: () => ({ meta: [{ title: "Home · Choguild" }] }),
  component: HomePage,
});

function HomePage() {
  const { sessionAddress, profile, featured, leaders, stats } = Route.useLoaderData();
  const examplesOnly = featured.length > 0 && featured.every((item) => item.isDemo);
  const details = profile
    ? completionSummary(
        profileCompletion({
          biography: profile.biography,
          skills: profile.skills,
          portfolioUrl: profile.portfolioUrl,
          githubUrl: profile.githubUrl,
          xUrl: profile.xUrl,
          otherLinks: profile.otherLinks,
          avatarUrl: profile.avatarUrl,
        }),
      )
    : null;

  return (
    <div className="flex flex-col gap-12">
      <section className="grid items-center gap-8 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="stagger max-w-2xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1 font-mono text-xs text-body">
            <span className="pulse-dot size-1.5 rounded-full bg-success" aria-hidden="true" />
            <span className="blink">gm, chog</span>
          </p>
          <h1 className="mt-5 text-[2.75rem] leading-[1.02] font-bold tracking-tight text-ink sm:text-6xl">
            Show the work.
            <br />
            <span className="text-sand">Wear the name.</span>
          </h1>
          <p className="mt-4 max-w-lg text-[17px] leading-7 text-body">
            The contributor guild for Monad. Claim a passport, pick up real work, and climb the ranking with every
            accepted contribution.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/discover" search={emptyBoardSearch()}>
                Explore opportunities
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/passport">{profile ? "Your Passport" : "Create your Passport"}</Link>
            </Button>
          </div>
          <p className="mt-4 text-sm leading-5 text-muted">
            {profile
              ? `${profile.displayName} is signed in as @${profile.username}. ${details}`
              : sessionAddress
                ? `${shortAddress(sessionAddress)} is signed in, and the passport is not saved yet.`
                : "No passport session. Connecting a wallet does not create one."}{" "}
            <Link to="/network" className="font-semibold text-sand hover:text-sand-hover">Network status</Link>
          </p>
        </div>
        <div className="relative order-first mx-auto w-28 sm:w-40 md:order-none md:w-52" aria-hidden="true">
          <Logo float className="rotate-2 [&_img]:rounded-3xl [&_img]:ring-1 [&_img]:ring-line" />
        </div>
      </section>

      <div className="marquee -mx-4 overflow-hidden border-y border-line py-3 sm:-mx-6" aria-hidden="true">
        <div className="marquee-track flex w-max gap-8 font-mono text-sm whitespace-nowrap text-muted">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-8">
              {TICKER.map((item) => (
                <span key={item} className="flex items-center gap-8">
                  {item}
                  <Sparkles className="size-3.5 text-sand" />
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      <dl className="grid grid-cols-3 divide-x divide-line overflow-hidden rounded-xl border border-line bg-elevated">
        {[
          ["Passports", stats.passports],
          ["Open work", stats.openOpportunities],
          ["Accepted", stats.acceptedWork],
        ].map(([label, value]) => (
          <div key={label} className="px-3 py-5 text-center sm:px-6">
            <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">{label}</dt>
            <dd className="mt-1 font-mono text-2xl font-bold text-ink sm:text-3xl">
              <CountUp value={Number(value)} />
            </dd>
          </div>
        ))}
      </dl>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <div className="rounded-2xl border border-line bg-elevated p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-bold text-ink">
              <Trophy className="size-5 text-warning" aria-hidden="true" />
              Top of the ladder
            </h2>
            <Link to="/ranking" className="text-sm font-semibold text-sand hover:text-sand-hover">Full ranking</Link>
          </div>
          {leaders.length > 0 ? (
            <ol className="stagger mt-4 flex flex-col gap-2">
              {leaders.map((person) => (
                <li key={person.username}>
                  <Link
                    to="/passport/$username"
                    params={{ username: person.username }}
                    className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-secondary"
                  >
                    <span className="w-6 font-mono text-sm text-muted">#{person.rank}</span>
                    <Avatar name={person.displayName} url={person.avatarUrl} />
                    <span className="min-w-0 flex-1 truncate font-semibold text-ink">{person.displayName}</span>
                    <TierBadge tier={person.tier} />
                    <span className="font-mono text-sm text-ink">{formatXp(person.xp)}</span>
                  </Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="dot-grid mt-4 rounded-xl border border-dashed border-line p-6 text-center">
              <p className="font-semibold text-ink">No one has claimed #1 yet.</p>
              <p className="mt-1 text-sm text-body">Save a passport and you are on the ladder today.</p>
              <Button asChild size="compact" className="mt-4">
                <Link to="/passport">Claim your spot</Link>
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-line bg-elevated p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-ink">Ranks to unlock</h2>
            <Link to="/how-it-works" hash="xp" className="text-sm font-semibold text-sand hover:text-sand-hover">How XP works</Link>
          </div>
          <ol className="mt-4 flex flex-col gap-3">
            {TIERS.map((tier, index) => (
              <li key={tier.name} className="flex items-center gap-3">
                <span className="w-14 shrink-0 text-right font-mono text-xs text-muted">{tier.min}+</span>
                <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary">
                  <span className="block h-full rounded-full bg-action" style={{ width: `${(index + 1) * 20}%` }} />
                </span>
                <TierBadge tier={tier.name} className="w-28 justify-center" />
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section>
        <SectionHeader
          title="How the guild works"
          action={
            <Button asChild variant="secondary" size="compact">
              <Link to="/how-it-works">Full guide</Link>
            </Button>
          }
        >
          Three steps from wallet to reputation.
        </SectionHeader>
        <ol className="stagger mt-4 grid gap-4 md:grid-cols-3">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <li key={step.title}>
                <Link to={step.to} className="card-pop group flex h-full flex-col gap-3 rounded-xl border border-line bg-elevated p-5">
                  <div className="flex items-center justify-between">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-action/15 text-sand ring-1 ring-action/40 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="font-mono text-xs text-muted">0{index + 1}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                  <p className="text-sm leading-6 text-body">{step.body}</p>
                  <span className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-sand">
                    {step.cta}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section id="featured" className="scroll-mt-[4.5rem]">
        <SectionHeader
          title={examplesOnly ? "Featured examples" : "On the board"}
          action={
            <Button asChild variant="secondary" size="compact">
              <Link to="/discover" search={emptyBoardSearch()}>View all</Link>
            </Button>
          }
        >
          {examplesOnly
            ? "These listings show the board. They are demo content and do not accept applications."
            : "Live opportunities are listed with any remaining examples. Demo listings do not accept applications."}
        </SectionHeader>
        <ul className="stagger mt-4 grid gap-3">
          {featured.map((item) => (
            <OpportunityCardView key={item.id} item={item} />
          ))}
        </ul>
      </section>
    </div>
  );
}

const TICKER = [
  "Claim a passport",
  "Find open work",
  "Ship it",
  "Get accepted",
  "Earn XP",
  "Hatchling → Legend",
  "Built on Monad",
];

const STEPS = [
  {
    title: "Claim your passport",
    body: "Sign a message with your wallet and save a public profile with your skills and links.",
    cta: "Open passport",
    to: "/passport",
    icon: IdCard,
  },
  {
    title: "Find open work",
    body: "Browse the board, filter by skill and compensation, and apply to what fits.",
    cta: "Discover",
    to: "/discover",
    icon: Compass,
  },
  {
    title: "Ship and climb",
    body: "Submit evidence once you are accepted. Every accepted piece of work earns XP on the ranking.",
    cta: "See the ranking",
    to: "/ranking",
    icon: ScrollText,
  },
] as const;
