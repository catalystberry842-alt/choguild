import { Link, createFileRoute } from "@tanstack/react-router";
import { PosterMark } from "@/components/board/opportunity-card";
import { Avatar } from "@/components/ranking/bits";
import { listBoard } from "@/lib/board/functions";
import { COMPENSATION_LABEL, type CompensationType } from "@/lib/board/copy";
import { projectLabel } from "@/lib/board/display";
import { emptyBoardSearch } from "@/lib/board/search";
import { getPassportState } from "@/lib/passport/functions";
import { getRanking } from "@/lib/ranking/functions";
import { formatXp, rankContributors, tierFor } from "@/lib/ranking/xp";
import { deadlineCountdown } from "@/lib/board/display";
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
      stream: board.items.slice(0, 10),
      leaders: rankContributors(ranking.contributors, "overall", 5),
      stats: ranking.stats,
    };
  },
  staticData: { title: "Home" },
  head: () => seo({ title: "Choguild · Get work and earn your rank", description: "Find work, prove it, climb the ladder. The contributor guild on Monad.", path: "/" }),
  component: HomePage,
});

const STEPS: { n: string; label: string; body: string; to: "/passport" | "/discover" | "/submissions" | "/ranking"; cta: string }[] = [
  { n: "01", label: "Claim a passport", body: "Sign one message with your wallet. No gas, no seed phrase.", to: "/passport", cta: "Claim yours" },
  { n: "02", label: "Pick up work", body: "Apply to open listings published by other passport holders.", to: "/discover", cta: "Browse the board" },
  { n: "03", label: "Ship and earn rank", body: "Accepted evidence turns into XP and moves you up the public ladder.", to: "/ranking", cta: "See the ladder" },
];

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6 2xl:max-w-7xl";

function HomePage() {
  return (
    <div>
      <Hero />
      <div className={wrap}>
        <Steps />
      </div>
      <Stream />
      <div className={wrap}>
        <Boards />
        <Closing />
      </div>
    </div>
  );
}

function Hero() {
  const { profile, stats, leaders } = Route.useLoaderData();
  const top = leaders[0];
  return (
    <section aria-labelledby="hero-title" className="px-2.5 pt-2.5 sm:px-4 sm:pt-4">
      <div className="stage mx-auto max-w-[1400px]">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-20 pb-8 sm:px-8 sm:pt-28 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-end lg:gap-16 lg:pt-44 lg:pb-16 2xl:max-w-7xl">
          <div>
            <Link to="/discover" search={emptyBoardSearch()} className="pill-glass rise group inline-flex items-center gap-2.5 rounded-full py-1.5 pr-3 pl-3 text-small text-ink">
              <span className="livedot" aria-hidden="true" />
              Monad mainnet <span className="text-muted">{fmt(stats.openOpportunities)} open listings</span>
              <span aria-hidden="true" className="arrow-slide text-muted">→</span>
            </Link>
            <h1 id="hero-title" className="t-display rise rise-1 mt-7 max-w-[12ch]">
              Real work earns you <em>real rank.</em>
            </h1>
            <p className="t-lead rise rise-2 mt-6 max-w-md text-body">
              A wallet-signed passport, a board of open work, and a public record of everything that got accepted.
            </p>
            <div className="rise rise-3 mt-9 flex flex-col gap-2.5 min-[420px]:flex-row">
              <Link to="/discover" search={emptyBoardSearch()} className="btn-glass group inline-flex h-12 items-center justify-center gap-2.5 rounded-full px-6 text-small font-medium">
                Browse open work <span aria-hidden="true" className="arrow-slide">→</span>
              </Link>
              <Link to="/passport" className="btn-ghost inline-flex h-12 items-center justify-center rounded-full px-6 text-small">
                {profile ? "Open your passport" : "Create your passport"}
              </Link>
            </div>
          </div>
          <div className="rise rise-4">
            {top ? (
              <Link to="/passport/$username" params={{ username: top.username }} className="glass group block p-5 transition-transform duration-200 hover:-translate-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="t-kicker">Top of the ladder</span>
                  <span className="pill-glass rounded-full px-2.5 py-0.5 text-label">#1 · {top.tier}</span>
                </div>
                <div className="mt-5 flex items-center gap-3.5">
                  <Avatar name={top.displayName} url={top.avatarUrl} size="lg" />
                  <div className="min-w-0">
                    <p className="truncate text-lead font-medium tracking-[-0.02em] text-ink">{top.displayName}</p>
                    <p className="truncate text-small text-muted">@{top.username}</p>
                  </div>
                </div>
                <p className="t-stat-xl mt-6 text-5xl">{formatXp(top.xp)}<span className="ml-1.5 text-base tracking-normal text-muted">XP</span></p>
                <TierProgress xp={top.xp} />
              </Link>
            ) : null}
            <dl className="glass mt-2.5 grid grid-cols-3 divide-x divide-line">
              {([["Passports", stats.passports], ["Accepted", stats.acceptedWork], ["Onchain txs", stats.onchainTxs]] as const).map(([label, value]) => (
                <div key={label} className="px-4 py-3.5">
                  <dt className="text-label text-muted">{label}</dt>
                  <dd className="mt-1 text-xl font-normal tracking-[-0.04em] tabular-nums text-ink">{fmt(value)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  );
}

function TierProgress({ xp }: { xp: number }) {
  const { next, progress } = tierFor(xp);
  return (
    <div className="mt-4">
      <div className="h-1 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-ink" style={{ width: `${Math.max(4, Math.round(progress * 100))}%` }} />
      </div>
      <p className="mt-2 text-label text-muted">{next ? `${(next.min - xp).toLocaleString("en-US")} XP to ${next.name}` : "Highest tier reached"}</p>
    </div>
  );
}

function Steps() {
  return (
    <section aria-labelledby="steps-title" className="pt-20 pb-20 sm:pt-28 sm:pb-24">
      <h2 id="steps-title" className="sr-only">How it works</h2>
      <ol className="grid gap-10 sm:grid-cols-3 sm:gap-6">
        {STEPS.map((step) => (
          <li key={step.n} className="rule-top">
            <p className="t-kicker">{step.n} · {step.to.slice(1)}</p>
            <p className="mt-3 text-[1.1875rem] tracking-[-0.02em] text-ink">{step.label}</p>
            <p className="mt-2 max-w-xs text-small leading-relaxed text-body">{step.body}</p>
            <Link
              to={step.to}
              search={step.to === "/discover" ? emptyBoardSearch() : undefined}
              className="group mt-5 inline-flex items-center gap-1.5 text-small text-ink"
            >
              {step.cta} <span aria-hidden="true" className="arrow-slide">→</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function Stream() {
  const { stream } = Route.useLoaderData();
  if (stream.length < 3) return null;
  const items = [...stream, ...stream];
  return (
    <section aria-label="Live listings" className="py-6">
      <div className="mx-auto mb-10 max-w-3xl px-4 text-center sm:mb-14">
        <h2 className="t-h2">Every listing is real. Every rank is <em>earned.</em></h2>
        <p className="mx-auto mt-4 max-w-lg text-base text-body">Live from the board right now. Hover to pause.</p>
      </div>
      <div className="stream">
        <ul className="stream-track py-3">
          {items.map((item, i) => {
            const due = deadlineCountdown(item.deadline);
            return (
              <li key={`${item.id}-${i}`} aria-hidden={i >= stream.length ? true : undefined}>
                <Link
                  to="/discover/$opportunityId"
                  params={{ opportunityId: item.id }}
                  tabIndex={i >= stream.length ? -1 : undefined}
                  className="bento flex w-64 flex-col p-4"
                >
                  <span className="flex items-center justify-between gap-2 text-label text-muted">
                    <span className="truncate">{projectLabel(item.projectName)}</span>
                    <span className="flex shrink-0 items-center gap-1.5 text-body">
                      <span className={item.status === "open" && due !== "Past due" ? "size-1.5 rounded-full bg-accent" : "size-1.5 rounded-full bg-muted"} />
                      {item.status === "open" && due !== "Past due" ? "Open" : "Closed"}
                    </span>
                  </span>
                  <span className="mt-6 flex items-center gap-2.5">
                    <PosterMark name={item.poster.displayName || item.poster.username || projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} avatarUrl={item.poster.avatarUrl} />
                    <span className="line-clamp-2 text-small font-medium leading-snug text-ink">{item.title}</span>
                  </span>
                  <span className="mt-4 flex items-center justify-between border-t border-line pt-3 text-label text-muted">
                    <span>{COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}</span>
                    <span className="tabular-nums">{due ?? "No deadline"}</span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function Boards() {
  const { leaders, featured } = Route.useLoaderData();
  return (
    <section aria-label="Open work and ladder" className="pt-24 sm:pt-32">
      <div className="mb-10 max-w-xl">
        <h2 className="t-h2">Pick something up. <em>Climb.</em></h2>
        <p className="mt-4 text-base text-body">The newest listings and the people at the top, straight from the database.</p>
      </div>
      <div className="grid gap-3 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
        <div className="surface flex flex-col overflow-hidden">
          <ListHead title="Open work" to="/discover" cta="All listings" />
          {featured.length > 0 ? (
            <ul className="divide-y divide-line">
              {featured.map((item) => (
                <li key={item.id}>
                  <Link to="/discover/$opportunityId" params={{ opportunityId: item.id }} className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.03] sm:px-6">
                    <PosterMark name={item.poster.displayName || item.poster.username || projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} avatarUrl={item.poster.avatarUrl} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-base text-ink">{item.title}</span>
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
        <div className="surface flex flex-col overflow-hidden">
          <ListHead title="Top of the ladder" to="/ranking" cta="Full ranking" />
          {leaders.length > 0 ? (
            <ol className="divide-y divide-line">
              {leaders.map((person) => (
                <li key={person.username}>
                  <Link to="/passport/$username" params={{ username: person.username }} className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-white/[0.03] sm:px-6">
                    <span className="w-5 text-small tabular-nums text-muted">{person.rank}</span>
                    <Avatar name={person.displayName} url={person.avatarUrl} />
                    <span className="min-w-0 flex-1 truncate text-base text-ink">{person.displayName}</span>
                    <span className="text-small tabular-nums text-ink">
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
      </div>
    </section>
  );
}

function ListHead({ title, to, cta }: { title: string; to: "/discover" | "/ranking"; cta: string }) {
  return (
    <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-6">
      <h3 className="t-h3">{title}</h3>
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
    <section className="invert-panel mt-24 flex flex-col items-start justify-between gap-8 px-6 py-10 sm:mt-32 sm:px-10 sm:py-14 md:flex-row md:items-end">
      <div>
        <p className="text-label font-medium tracking-[0.08em] text-[#5f636a] uppercase">One passport</p>
        <h2 className="t-h2 mt-3 max-w-xl">Every piece of work, <em className="!text-[#5f636a]">on the record.</em></h2>
      </div>
      <Link to="/passport" className="group inline-flex h-12 shrink-0 items-center gap-2.5 rounded-full bg-[#0b0c0e] px-6 text-small font-medium text-white transition-transform active:scale-[0.97]">
        {profile ? "Open your passport" : "Get your passport"} <span aria-hidden="true" className="arrow-slide">→</span>
      </Link>
    </section>
  );
}
