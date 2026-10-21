import { Link, createFileRoute } from "@tanstack/react-router";
import { PosterMark } from "@/components/board/opportunity-card";
import { Avatar } from "@/components/ranking/bits";
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

const STEPS: { n: string; label: string; body: string; to: "/passport" | "/discover" | "/submissions" | "/ranking" }[] = [
  { n: "01", label: "Claim a passport", body: "Sign one message with your wallet. No gas, no seed phrase.", to: "/passport" },
  { n: "02", label: "Pick up work", body: "Apply to open listings published by other passport holders.", to: "/discover" },
  { n: "03", label: "Submit evidence", body: "Send links to what you shipped. The publisher reviews it.", to: "/submissions" },
  { n: "04", label: "Earn rank", body: "Accepted work turns into XP and moves you up the ladder.", to: "/ranking" },
];

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));

function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 2xl:max-w-7xl">
      <Hero />
      <Steps />
      <Boards />
      <Closing />
    </div>
  );
}

function Hero() {
  const { profile, stats } = Route.useLoaderData();
  const rows = [
    ["Open listings", stats.openOpportunities],
    ["Public passports", stats.passports],
    ["Accepted submissions", stats.acceptedWork],
    ["Onchain txs by members", stats.onchainTxs],
  ] as const;
  return (
    <section aria-labelledby="hero-title" className="grid gap-12 border-b border-line pt-16 pb-16 sm:pt-24 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-end lg:gap-16 lg:pt-28 lg:pb-24">
      <div className="fade-up">
        <p className="t-kicker flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-success" aria-hidden="true" />
          Contributor guild · Monad mainnet
        </p>
        <h1 id="hero-title" className="t-display mt-6 max-w-[13ch] text-ink">
          Get work and earn your <em>rank.</em>
        </h1>
        <p className="t-lead mt-6 max-w-lg">
          A wallet-signed passport, a board of open work, and a public record of everything that got accepted.
        </p>
        <div className="mt-9 flex flex-col gap-2.5 min-[420px]:flex-row">
          <Link to="/discover" search={emptyBoardSearch()} className="btn-glass group inline-flex h-11 items-center justify-center gap-2.5 rounded-full px-6 text-small font-medium">
            Browse open work <span aria-hidden="true" className="arrow-slide">→</span>
          </Link>
          <Link to="/passport" className="inline-flex h-11 items-center justify-center rounded-full border border-line-strong px-6 text-small text-ink transition-colors hover:border-muted">
            {profile ? "Open your passport" : "Create your passport"}
          </Link>
        </div>
      </div>
      <aside aria-label="Guild right now" className="surface fade-up p-5 sm:p-6" style={{ animationDelay: "120ms" }}>
        <div className="flex items-center justify-between">
          <p className="t-kicker">Right now</p>
          <span className="flex items-center gap-1.5 text-label text-muted">
            <span className="size-1.5 rounded-full bg-success" aria-hidden="true" /> Live
          </span>
        </div>
        <dl className="mt-4 divide-y divide-line">
          {rows.map(([label, value]) => (
            <div key={label} className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="text-small text-body">{label}</dt>
              <dd className="text-2xl font-medium tracking-[-0.04em] tabular-nums text-ink">{fmt(value)}</dd>
            </div>
          ))}
        </dl>
      </aside>
    </section>
  );
}

function Steps() {
  return (
    <section aria-labelledby="steps-title" className="py-16 sm:py-24">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h2 id="steps-title" className="t-h2 max-w-md">Four steps, one <em>record.</em></h2>
        <Link to="/how-it-works" className="group text-small text-body hover:text-ink">
          How XP works <span aria-hidden="true" className="arrow-slide inline-block">→</span>
        </Link>
      </div>
      <ol className="mt-8 grid gap-x-6 gap-y-6 sm:mt-10 sm:grid-cols-2 sm:gap-y-8 lg:grid-cols-4">
        {STEPS.map((step) => (
          <li key={step.n}>
            <Link
              to={step.to}
              search={step.to === "/discover" ? emptyBoardSearch() : step.to === "/submissions" ? { view: "mine", status: "all" } : undefined}
              className="group rule-top block"
            >
              <span className="text-label tabular-nums text-muted">{step.n}</span>
              <span className="t-h3 mt-3 block text-ink sm:mt-6">{step.label}</span>
              <span className="t-body mt-2 block text-pretty">{step.body}</span>
              <span aria-hidden="true" className="arrow-slide mt-4 hidden text-muted group-hover:text-ink sm:inline-block">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Boards() {
  const { leaders, featured } = Route.useLoaderData();
  return (
    <section aria-label="Open work and ladder" className="grid gap-6 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      <div className="surface flex flex-col">
        <ListHead title="Open work" to="/discover" cta="All listings" />
        {featured.length > 0 ? (
          <ul className="divide-y divide-line">
            {featured.map((item) => (
              <li key={item.id}>
                <Link to="/discover/$opportunityId" params={{ opportunityId: item.id }} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.02] sm:px-6">
                  <PosterMark name={item.poster.displayName || item.poster.username || projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} avatarUrl={item.poster.avatarUrl} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-base font-medium text-ink">{item.title}</span>
                    <span className="block truncate text-small text-muted">
                      {projectLabel(item.projectName)} · {COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}
                    </span>
                  </span>
                  <span aria-hidden="true" className="arrow-slide text-muted group-hover:text-ink">→</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <Empty body="Nobody has published a listing yet." to="/opportunities/new" cta="Publish the first one" />
        )}
      </div>
      <div className="surface flex flex-col">
        <ListHead title="Top of the ladder" to="/ranking" cta="Full ranking" />
        {leaders.length > 0 ? (
          <ol className="divide-y divide-line">
            {leaders.map((person) => (
              <li key={person.username}>
                <Link to="/passport/$username" params={{ username: person.username }} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.02] sm:px-6">
                  <span className="w-5 text-small tabular-nums text-muted">{person.rank}</span>
                  <Avatar name={person.displayName} url={person.avatarUrl} />
                  <span className="min-w-0 flex-1 truncate text-base text-ink">{person.displayName}</span>
                  <span className="text-small font-medium tabular-nums text-ink">
                    {formatXp(person.xp)} <span className="text-muted">XP</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <Empty body="Nobody is ranked yet." to="/passport" cta="Claim the first spot" />
        )}
      </div>
    </section>
  );
}

function ListHead({ title, to, cta }: { title: string; to: "/discover" | "/ranking"; cta: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
      <h2 className="t-h3">{title}</h2>
      <Link to={to} search={to === "/discover" ? emptyBoardSearch() : undefined} className="group text-small text-muted hover:text-ink">
        {cta} <span aria-hidden="true" className="arrow-slide inline-block">→</span>
      </Link>
    </div>
  );
}

function Empty({ body, to, cta }: { body: string; to: "/passport" | "/opportunities/new"; cta: string }) {
  return (
    <div className="flex flex-1 flex-col items-start gap-3 px-5 py-8 sm:px-6">
      <p className="t-body">{body}</p>
      <Link to={to} className="t-link text-small">{cta}</Link>
    </div>
  );
}

function Closing() {
  const { profile } = Route.useLoaderData();
  return (
    <section className="mt-16 flex flex-col items-start justify-between gap-6 border-t border-line pt-10 sm:mt-24 md:flex-row md:items-end">
      <h2 className="t-h2 max-w-xl">One passport. Every piece of work, <em>on the record.</em></h2>
      <Link to="/passport" className="btn-glass group inline-flex h-11 shrink-0 items-center gap-2.5 rounded-full px-6 text-small font-medium">
        {profile ? "Open your passport" : "Get your passport"} <span aria-hidden="true" className="arrow-slide">→</span>
      </Link>
    </section>
  );
}
