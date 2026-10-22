import { Link, createFileRoute } from "@tanstack/react-router";
import { PosterMark } from "@/components/board/opportunity-card";
import { listBoard } from "@/lib/board/functions";
import { COMPENSATION_LABEL, type CompensationType } from "@/lib/board/copy";
import { projectLabel } from "@/lib/board/display";
import { emptyBoardSearch } from "@/lib/board/search";
import { getPassportState } from "@/lib/passport/functions";
import { getRanking } from "@/lib/ranking/functions";
import { formatXp, rankContributors } from "@/lib/ranking/xp";
import { deadlineCountdown } from "@/lib/board/display";
import { seo } from "@/lib/seo";
import { InView } from "@/components/home/in-view";
import { XP_RULES, TIERS } from "@/lib/ranking/xp";
import { chogImageUrl, CHOG_EXPLORER_URL } from "@/lib/chog/chog";
import { ChogCard } from "@/components/chog/chog-card";
import { QUESTS, STREAK_BONUS_CAP } from "@/lib/quests/quests";
import type { ReactNode } from "react";

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
      seasonLeaders: rankContributors(ranking.contributors, "season", 5).filter((p) => p.xp > 0),
      season: ranking.season,
      stats: ranking.stats,
    };
  },
  staticData: { title: "Home" },
  head: () => seo({ title: "Choguild · Your Chog is the member", description: "A work guild where each Chog Genesis NFT is the member: its passport, XP, rank and history live on the token and travel with it.", path: "/" }),
  component: HomePage,
});

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6 2xl:max-w-7xl";

function HomePage() {
  return (
    <div className={wrap}>
      <Hero />
      <div className="spine mt-16 flex flex-col gap-20 sm:mt-20 sm:gap-28">
        <ChogEntry />
        <QuestEntry />
        <LadderEntry />
        <WorkEntry />
        <ReviewEntry />
        <PublishEntry />
        <HowEntry />
      </div>
      <Cta />
    </div>
  );
}

/* ── shared ─────────────────────────────────────────────── */
function Entry({ id, title, body, children, cta }: { id: string; title: ReactNode; body: ReactNode; children: ReactNode; cta?: ReactNode }) {
  return (
    <InView as="section" id={id} aria-labelledby={`${id}-t`} className="entry scroll-mt-24">
      <div className="grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-14">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <h2 id={`${id}-t`} className="t-h2 text-ink">{title}</h2>
          <div className="t-body mt-4 max-w-md">{body}</div>
          {cta ? <div className="mt-6 flex flex-wrap gap-2">{cta}</div> : null}
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </InView>
  );
}

function Go({ to, children, primary, hash }: { to: string; children: ReactNode; primary?: boolean; hash?: string }) {
  return (
    <Link
      to={to as "/"}
      hash={hash}
      search={to === "/discover" ? (emptyBoardSearch() as never) : to === "/submissions" || to === "/applications" ? ({ view: "mine", status: "all" } as never) : undefined}
      className={(primary ? "btn-glass" : "btn-ghost") + " group inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] font-medium"}
    >
      {children} <span aria-hidden="true" className="arrow-slide">→</span>
    </Link>
  );
}

/* ── hero ───────────────────────────────────────────────── */
function Hero() {
  const { profile, stats } = Route.useLoaderData();
  const chain: [string, string, boolean][] = [
    ["Hold a Chog", "ownerOf checked live", false],
    ["Act as it", "wallet signs once, picks a Chog", false],
    ["Quest & ship", "daily quests, accepted work", false],
    ["+XP on the token", "written to Chog #id", true],
    ["Transfer", "the record goes with the NFT", true],
  ];
  return (
    <InView as="section" aria-labelledby="hero-title" className="pt-10 sm:pt-14 lg:pt-20">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end lg:gap-16">
        <div>
          <h1 id="hero-title" className="t-display rise text-ink">
            Your Chog<br />is the <em>member.</em>
          </h1>
          <p className="t-body rise rise-2 mt-6 max-w-md">Each Chog Genesis NFT carries its own passport, XP, rank and work history. Hold one to act as it; send it and the record goes too. No Chog, no membership.</p>
          <div className="rise rise-3 mt-6 flex flex-wrap gap-2">
            <Go to="/discover" primary>Browse open work</Go>
            <Go to="/passport">{profile ? "Open your Chog" : "Act as your Chog"}</Go>
          </div>
        </div>
        {/* the loop, drawn: each step lights up in turn */}
        <ol aria-label="How a contribution flows" className="diagram rise rise-3 relative p-5">
          <span className="absolute top-9 bottom-9 left-[1.95rem] w-px bg-line-strong" aria-hidden="true">
            <span className="anim a-grow absolute inset-0 block origin-top bg-purple" />
          </span>
          {chain.map(([step, sub, hot], i) => (
            <li key={step} className="relative flex items-center gap-4 py-2.5">
              <span className={"anim a-pop relative z-10 flex size-6 shrink-0 items-center justify-center rounded-md border text-[10px] font-mono " + (hot ? "border-purple bg-purple text-white" : "border-line-strong bg-elevated text-body")} style={{ animationDelay: `${i * 0.45}s` }}>{i + 1}</span>
              <span className="anim a-pop min-w-0" style={{ animationDelay: `${i * 0.45 + 0.1}s` }}>
                <span className={"block text-small font-medium " + (hot ? "text-purple-ink" : "text-ink")}>{step}</span>
                <span className="ix block">{sub}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
      <dl className="mt-12 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {([["Chog members", stats.passports], ["Open listings", stats.openOpportunities], ["Accepted work", stats.acceptedWork], ["Quests today", stats.questsToday]] as const).map(([label, value], i) => (
          <div key={label} className={"py-5 pr-4 " + (i > 0 ? "sm:border-l sm:border-line sm:pl-6" : "") + (i % 2 === 1 ? " border-l border-line pl-4 sm:pl-6" : "") + (i > 1 ? " border-t border-line sm:border-t-0" : "")}>
            <dt className="ix">{label}</dt>
            <dd className="t-stat-num mt-2 text-ink">{fmt(value)}</dd>
          </div>
        ))}
      </dl>
    </InView>
  );
}

/* ── chog is the member ─────────────────────────────────── */
function ChogEntry() {
  const { leaders, stats } = Route.useLoaderData();
  const top = leaders[0];
  return (
    <Entry
      id="chog"
      title={<>The NFT holds the <em>record.</em></>}
      body={<>Passports, XP, tier and accepted work are keyed to a Chog token id, not a wallet. Whoever owns the Chog right now (live <span className="font-mono text-small">ownerOf</span> on Monad) acts as it. Sell or send it and the new holder inherits its rank. A wallet with several Chogs picks which one to act as; one with none can only look. <span className="text-ink">{fmt(stats.passports)} Chogs</span> have joined.</>}
      cta={<><Go to="/passport" primary>Act as your Chog</Go><a href={CHOG_EXPLORER_URL} target="_blank" rel="noreferrer" className="btn-ghost group inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] font-medium">Collection <span aria-hidden="true" className="arrow-slide">↗</span></a></>}
    >
      <div className="diagram grid gap-5 p-5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:p-6">
        {top ? (
          <Link to="/chog/$chogId" params={{ chogId: String(top.chogId) }} className="mx-auto w-full max-w-[13rem]">
            <ChogCard chogId={top.chogId} name={top.displayName} xp={top.xp} rank={top.rank} streak={top.streak} size="sm" />
          </Link>
        ) : (
          <div className="chog-card mx-auto flex aspect-[3/4] w-full max-w-[13rem] items-center justify-center p-4 text-center text-small text-muted">The first Chog to save a passport takes this card.</div>
        )}
        <ol className="flex flex-col justify-center gap-3 text-small">
          {[
            ["Tier frames", "Hatchling to Legend. The card's frame, title and glow change as the Chog climbs."],
            ["Live ownership", "Every write re-checks ownerOf. Transferred Chogs drop out of the old wallet's session."],
            ["No self-dealing", "Chogs held by the same wallet can't hire, accept or review each other, and earn no XP from each other."],
          ].map(([t, b]) => (
            <li key={t} className="cell p-3">
              <p className="font-medium text-ink">{t}</p>
              <p className="mt-0.5 text-body">{b}</p>
            </li>
          ))}
        </ol>
      </div>
    </Entry>
  );
}

/* ── daily quests ───────────────────────────────────────── */
function QuestEntry() {
  return (
    <Entry
      id="quests"
      title={<>Show up daily. Keep the <em>streak.</em></>}
      body={<>Three quick quests a day: check in, scout an open listing, size up a rival Chog. Check-ins stack a streak bonus. Hit a new tier and the card levels up with confetti. One Chog per wallet per quest per day, so a bag of Chogs can't farm it.</>}
      cta={<Go to="/passport" primary>Today's quests</Go>}
    >
      <div className="diagram p-5 sm:p-6">
        <ul className="divide-y divide-line">
          {QUESTS.map((q, i) => (
            <li key={q.id} data-done={i === 0 ? "true" : undefined} className="quest-row anim a-in flex items-center gap-3 py-3" style={{ animationDelay: `${i * 0.15}s` }}>
              <span className="quest-check" aria-hidden="true">{i === 0 ? "✓" : null}</span>
              <span className="min-w-0 flex-1">
                <span className="block text-small font-medium text-ink">{q.label}</span>
                <span className="block text-label text-muted">{q.detail}</span>
              </span>
              <span className="text-small tabular-nums text-muted">+{q.xp}{q.id === "checkin" ? "+streak" : ""}</span>
            </li>
          ))}
        </ul>
        <p className="ix mt-3">streak bonus +1 XP a day, up to +{STREAK_BONUS_CAP} · resets 00:00 UTC</p>
      </div>
    </Entry>
  );
}

/* ── open work ───────────────────────────────────────── */
function WorkEntry() {
  const { featured, stats } = Route.useLoaderData();
  return (
    <Entry
      id="work"
      title={<>Listings posted by Chogs, taken by <em>Chogs.</em></>}
      body={<>A Chog publishes a listing with terms, deadline and skills; other Chogs apply. Filter by category or compensation. <span className="text-ink">{fmt(stats.openOpportunities)} open</span> right now.</>}
      cta={<Go to="/discover" primary>Browse the board</Go>}
    >
      <ul className="flex flex-col gap-2">
        {featured.length > 0 ? featured.slice(0, 4).map((item, i) => {
          const due = deadlineCountdown(item.deadline);
          return (
            <li key={item.id} className="anim a-in" style={{ animationDelay: `${i * 0.12}s` }}>
              <Link to="/discover/$opportunityId" params={{ opportunityId: item.id }} className="bento group flex items-center gap-4 p-4 sm:p-5">
                <PosterMark name={item.poster.displayName || item.poster.username || projectLabel(item.projectName)} logoUrl={item.projectLogoUrl} avatarUrl={item.poster.avatarUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-medium text-ink">{item.title}</span>
                  <span className="ix block truncate">{projectLabel(item.projectName)} · {COMPENSATION_LABEL[item.compensationType as CompensationType] ?? item.compensationType}</span>
                </span>
                {item.holdersOnly ? <span className="tag chip-purple hidden sm:inline-flex">◆ Chog</span> : null}
                <span className="tag hidden sm:inline-flex">{due ?? "No deadline"}</span>
                <span aria-hidden="true" className="arrow-slide text-muted group-hover:text-ink">→</span>
              </Link>
            </li>
          );
        }) : <li className="bento p-6 text-body">Nobody has published a listing yet. <Link to="/opportunities/new" className="t-link">Publish the first one</Link>.</li>}
      </ul>
    </Entry>
  );
}

/* ── 03 review ──────────────────────────────────────────── */
function ReviewEntry() {
  const { stats } = Route.useLoaderData();
  return (
    <Entry
      id="review"
      title={<>Ship it. Get it <em>accepted.</em></>}
      body={<>Apply to a listing, then submit evidence links for what you shipped. The poster's Chog reviews it; acceptance writes XP to your Chog. <span className="text-ink">{fmt(stats.acceptedWork)} accepted</span> to date.</>}
      cta={<><Go to="/applications" primary>Your applications</Go><Go to="/submissions">Submissions</Go></>}
    >
      <div className="diagram p-5 sm:p-8">
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["LISTING", "An open listing", "Open"],
            ["APPLICATION", "Your application", "Accepted"],
            ["SUBMISSION", "Your evidence links", "Accepted"],
          ].map(([k, t, s], i) => (
            <div key={k} className="cell anim a-pop p-4" style={{ animationDelay: `${i * 0.5}s` }}>
              <p className="ix">{k}</p>
              <p className="mt-2 truncate text-small text-ink">{t}</p>
              <span className={"tag mt-3 " + (s === "Accepted" ? "tag-p" : "")}>{s}</span>
            </div>
          ))}
        </div>
        <div className="relative mt-6 flex items-center justify-between rounded-xl border border-line-strong px-4 py-3">
          <span className="ix">CHOG XP</span>
          <span className="anim a-flyv d4 absolute left-1/2 -top-12 tag tag-p" style={{ ["--dy" as string]: "44px" }}>+100 XP</span>
          <span className="text-small tabular-nums text-ink">accepted submission = 100 · application = 25</span>
        </div>
      </div>
    </Entry>
  );
}

/* ── leaderboard + season ───────────────────────────────── */
function LadderEntry() {
  const { leaders, seasonLeaders, season } = Route.useLoaderData();
  const max = Math.max(1, ...leaders.map((l) => l.xp));
  return (
    <Entry
      id="ladder"
      title={<>A leaderboard of <em>Chogs.</em></>}
      body={<>All-time XP from accepted work, listings and quests, plus a weekly season where every Chog starts at zero on Monday. Five tiers, from {TIERS[0].name} to {TIERS[TIERS.length - 1].name}. Share a rank card on X straight from a Chog's page.</>}
      cta={<><Go to="/ranking" primary>Leaderboard</Go><Link to="/ranking" search={{ by: "season" }} className="btn-ghost group inline-flex h-10 items-center gap-2 rounded-full px-4 text-[0.875rem] font-medium">Season {season.number}</Link></>}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <ol className="bento divide-y divide-line overflow-hidden" aria-label="All time">
          <li className="ix px-4 py-2.5">ALL TIME</li>
          {leaders.length > 0 ? leaders.map((p, i) => (
            <li key={p.chogId}>
              <Link to="/chog/$chogId" params={{ chogId: String(p.chogId) }} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-line/40">
                <span className={"flex size-6 items-center justify-center rounded-md text-label tabular-nums " + (i === 0 ? "bg-purple text-white" : "text-muted")}>{p.rank}</span>
                <img src={chogImageUrl(p.chogId)} alt="" width={32} height={32} loading="lazy" className="size-8 rounded-lg bg-secondary object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small text-ink">{p.displayName} <span className="text-muted">#{p.chogId}</span></span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line-strong">
                    <span className="anim a-fill block h-full rounded-full bg-purple" style={{ ["--from" as string]: "0.02", ["--to" as string]: String(p.xp / max), animationDelay: `${i * 0.15}s` }} />
                  </span>
                </span>
                <span className="text-right text-small tabular-nums text-ink">{formatXp(p.xp)}</span>
              </Link>
            </li>
          )) : <li className="p-4 text-small text-body">No Chog is ranked yet.</li>}
        </ol>
        <ol className="bento divide-y divide-line overflow-hidden" aria-label={`Season ${season.number}`}>
          <li className="ix px-4 py-2.5">SEASON {season.number} · THIS WEEK</li>
          {seasonLeaders.length > 0 ? seasonLeaders.map((p) => (
            <li key={p.chogId}>
              <Link to="/chog/$chogId" params={{ chogId: String(p.chogId) }} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-line/40">
                <span className="w-6 text-center text-label tabular-nums text-muted">{p.rank}</span>
                <img src={chogImageUrl(p.chogId)} alt="" width={32} height={32} loading="lazy" className="size-8 rounded-lg bg-secondary object-cover" />
                <span className="min-w-0 flex-1 truncate text-small text-ink">{p.displayName}</span>
                <span className="text-small tabular-nums text-ink">+{formatXp(p.xp)}</span>
              </Link>
            </li>
          )) : <li className="p-4 text-small text-body">Nobody has scored this week. Check in to lead Season {season.number}.</li>}
        </ol>
      </div>
    </Entry>
  );
}

/* ── 07 publish ─────────────────────────────────────────── */
function PublishEntry() {
  return (
    <Entry
      id="publish"
      title={<>Post work. Pick your <em>contributors.</em></>}
      body={<>Act as your Chog to publish a listing: title, terms, deadline, positions and skills. Then review the Chogs that apply and the work they submit. Published listings earn {XP_RULES[2].points} XP once they count.</>}
      cta={<Go to="/opportunities/new" primary>Publish a listing</Go>}
    >
      <div className="diagram p-5 sm:p-8">
        <div className="cell p-5">
          {["Title", "Terms", "Deadline", "Skills"].map((f, i) => (
            <div key={f} className="flex items-center gap-4 border-b border-line py-3 last:border-0">
              <span className="ix w-20">{f.toUpperCase()}</span>
              <span className="h-2 flex-1 overflow-hidden rounded-full bg-line-strong">
                <span className="anim a-line block h-full rounded-full bg-ink" style={{ animationDelay: `${i * 0.3}s`, width: `${90 - i * 15}%` }} />
              </span>
            </div>
          ))}
          <div className="mt-4 flex items-center justify-between">
            <span className="anim a-pop d4 tag tag-p">Published ✓</span>
            <span className="ix">visible on the board</span>
          </div>
        </div>
      </div>
    </Entry>
  );
}

/* ── 08 how ─────────────────────────────────────────────── */
function HowEntry() {
  const steps = [
    ["Act as your Chog", "Sign once, pick a Chog you hold."],
    ["Quest daily", "Check in, scout, keep the streak."],
    ["Take work", "Apply and submit evidence."],
    ["Climb", "XP and tier live on the token."],
  ];
  return (
    <Entry
      id="how"
      title={<>Four steps from Chog to <em>rank.</em></>}
      body={<>Every XP value is computed from recorded events and live chain reads, never typed in. Pair rules and monthly caps keep it fair.</>}
      cta={<><Go to="/how-it-works" primary>How it works</Go><Go to="/docs">Read the docs</Go></>}
    >
      <ol className="grid gap-2 sm:grid-cols-2">
        {steps.map(([t, b], i) => (
          <li key={t} className="bento anim a-in p-5" style={{ animationDelay: `${i * 0.12}s` }}>
            <p className="t-h3 text-ink">{t}</p>
            <p className="mt-1 text-small text-body">{b}</p>
          </li>
        ))}
      </ol>
    </Entry>
  );
}

/* ── CTA ────────────────────────────────────────────────── */
function Cta() {
  const { profile } = Route.useLoaderData();
  return (
    <section id="start" className="mt-20 grid gap-6 rounded-[1.25rem] bg-purple px-6 py-10 text-white sm:mt-28 sm:px-10 sm:py-12 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <h2 className="t-h2 max-w-2xl !text-white [&_em]:!text-white/65">Bring your Chog. Its record starts <em className="italic">today.</em></h2>
      </div>
      <Link to="/passport" className="btn-white group inline-flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[0.875rem] font-medium">
        {profile ? "Open your Chog" : "Act as your Chog"} <span aria-hidden="true" className="arrow-slide">→</span>
      </Link>
    </section>
  );
}
