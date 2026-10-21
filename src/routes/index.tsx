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
import { deadlineCountdown } from "@/lib/board/display";
import { seo } from "@/lib/seo";
import { InView } from "@/components/home/in-view";
import { XP_RULES, TIERS } from "@/lib/ranking/xp";
import { CHOG_BOOST_CAP, CHOG_BOOST_RATE, chogImageUrl, CHOG_EXPLORER_URL } from "@/lib/chog/chog";
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
      people: ranking.contributors.map((c) => ({ username: c.username, txCount: c.txCount ?? null, chogCount: c.chog?.count ?? 0, chogIds: c.chog?.tokenIds?.slice(0, 1) ?? [], chogBonus: c.chogBonus ?? 0 })),
      leaders: rankContributors(ranking.contributors, "overall", 5),
      stats: ranking.stats,
    };
  },
  staticData: { title: "Home" },
  head: () => seo({ title: "Choguild · Ship work, earn your rank", description: "Find work, prove it, climb the ladder. The contributor guild on Monad.", path: "/" }),
  component: HomePage,
});

const fmt = (n: number | null) => (n === null ? "—" : n.toLocaleString("en-US"));
const wrap = "mx-auto w-full max-w-6xl px-4 sm:px-6 2xl:max-w-7xl";

function HomePage() {
  return (
    <div className={wrap}>
      <Hero />
      <div className="spine mt-24 flex flex-col gap-28 sm:mt-32 sm:gap-40">
        <PassportEntry />
        <WorkEntry />
        <ReviewEntry />
        <LadderEntry />
        <ChogEntry />
        <NetworkEntry />
        <PublishEntry />
        <HowEntry />
      </div>
      <Cta />
    </div>
  );
}

/* ── shared ─────────────────────────────────────────────── */
function Entry({ id, n, kicker, title, body, children, cta }: { id: string; n: string; kicker: string; title: ReactNode; body: ReactNode; children: ReactNode; cta?: ReactNode }) {
  return (
    <InView as="section" id={id} aria-labelledby={`${id}-t`} className="entry scroll-mt-24">
      <span className="entry-dot sq hidden lg:block" aria-hidden="true" />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-16">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="ix flex items-center gap-3"><span className="text-purple-ink">{n}</span><span className="h-px w-8 bg-line-strong" />{kicker}</p>
          <h2 id={`${id}-t`} className="t-h2 mt-5 text-ink">{title}</h2>
          <div className="mt-5 max-w-md text-base leading-relaxed text-body">{body}</div>
          {cta ? <div className="mt-8 flex flex-wrap gap-2.5">{cta}</div> : null}
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
      className={(primary ? "btn-glass" : "btn-ghost") + " group inline-flex h-11 items-center gap-2 rounded-full px-5 text-small font-medium"}
    >
      {children} <span aria-hidden="true" className="arrow-slide">→</span>
    </Link>
  );
}

/* ── hero ───────────────────────────────────────────────── */
function Hero() {
  const { profile, stats } = Route.useLoaderData();
  const chain = ["Passport", "Apply", "Accepted", "+XP", "Rank"];
  return (
    <InView as="section" aria-labelledby="hero-title" className="pt-16 sm:pt-24 lg:pt-28">
      <p className="ix rise flex items-center gap-3"><span className="sq a-blink" aria-hidden="true" />CHOGUILD · CONTRIBUTOR LEDGER · MONAD MAINNET</p>
      <h1 id="hero-title" className="t-display rise rise-1 mt-8 max-w-[11ch] text-ink">
        Ship work. Earn your <em>rank.</em>
      </h1>
      <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="rise rise-2">
          <p className="max-w-md text-lead text-body">A wallet-signed passport, a board of open work, and a public ladder of everything that got accepted.</p>
          <div className="mt-8 flex flex-col gap-2.5 min-[420px]:flex-row">
            <Go to="/discover" primary>Browse open work</Go>
            <Go to="/passport">{profile ? "Open your passport" : "Claim a passport"}</Go>
          </div>
        </div>
        {/* the loop, drawn */}
        <ol aria-label="How a contribution flows" className="rise rise-3 flex flex-wrap items-center gap-y-3">
          {chain.map((step, i) => (
            <li key={step} className="flex items-center">
              <span className={"anim a-pop tag " + (i === chain.length - 1 || step === "+XP" ? "tag-p" : "")} style={{ animationDelay: `${i * 0.35}s` }}>{step}</span>
              {i < chain.length - 1 ? (
                <span className="relative mx-1.5 block h-px w-6 bg-line-strong sm:w-8" aria-hidden="true">
                  <span className="anim a-line absolute inset-0 block bg-purple" style={{ animationDelay: `${i * 0.35 + 0.2}s` }} />
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
      <dl className="mt-16 grid grid-cols-2 border-y border-line sm:grid-cols-4">
        {([["Open listings", stats.openOpportunities], ["Passports", stats.passports], ["Accepted work", stats.acceptedWork], ["Onchain txs", stats.onchainTxs]] as const).map(([label, value], i) => (
          <div key={label} className={"py-6 pr-4 " + (i > 0 ? "sm:border-l sm:border-line sm:pl-6" : "") + (i % 2 === 1 ? " border-l border-line pl-4 sm:pl-6" : "") + (i > 1 ? " border-t border-line sm:border-t-0" : "")}>
            <dt className="ix">{label}</dt>
            <dd className="mt-2 text-4xl font-medium tracking-[-0.05em] tabular-nums text-ink sm:text-5xl">{fmt(value)}</dd>
          </div>
        ))}
      </dl>
    </InView>
  );
}

/* ── 01 passport ────────────────────────────────────────── */
function PassportEntry() {
  const { stats, profile } = Route.useLoaderData();
  return (
    <Entry
      id="passport" n="01" kicker="PASSPORT"
      title={<>One signature. <em>Your</em> passport.</>}
      body={<>Connect a browser wallet and sign one message. No gas, no seed phrase. Upload an avatar, add skills and links, and your public passport is live. <span className="text-ink">{fmt(stats.passports)} passports</span> so far.</>}
      cta={<Go to="/passport" primary>{profile ? "Open your passport" : "Claim yours"}</Go>}
    >
      <div className="diagram p-5 sm:p-8">
        <div className="grid items-center gap-4 sm:grid-cols-[auto_1fr_auto]">
          <div className="cell anim a-pop p-4">
            <p className="ix">WALLET</p>
            <p className="mt-2 font-mono text-small text-ink">0x…your wallet</p>
            <span className="tag tag-p mt-3">Sign message</span>
          </div>
          <div className="relative hidden h-px bg-line-strong sm:block" aria-hidden="true">
            <span className="anim a-line d1 absolute inset-0 block bg-purple" />
            <span className="anim a-fly d1 absolute -top-3 left-0 tag tag-p" style={{ ["--dx" as string]: "90px" }}>✓ sig</span>
          </div>
          <div className="cell anim a-pop d2 w-full p-4 sm:w-60">
            <div className="flex items-center gap-3">
              <span className="relative flex size-12 items-center justify-center rounded-full border border-dashed border-line-strong text-muted">
                <span className="text-lg">+</span>
                <span className="anim a-pop d3 absolute inset-0 rounded-full bg-purple" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-small font-medium text-ink">Your name</p>
                <p className="ix">@handle · Hatchling</p>
              </div>
            </div>
            <div className="mt-4 h-1 overflow-hidden rounded-full bg-line-strong">
              <div className="anim a-fill d3 h-full rounded-full bg-purple" style={{ ["--from" as string]: "0", ["--to" as string]: "0.2" }} />
            </div>
            <p className="ix mt-2">+10 XP · saved passport</p>
          </div>
        </div>
        <ul className="mt-8 grid gap-2 text-small text-body sm:grid-cols-3">
          {["Wallet-signed session", "Avatar upload with preview", "Skills, bio & links"].map((t) => (
            <li key={t} className="flex items-center gap-2"><span className="sq" aria-hidden="true" />{t}</li>
          ))}
        </ul>
      </div>
    </Entry>
  );
}

/* ── 02 open work ───────────────────────────────────────── */
function WorkEntry() {
  const { featured, stats } = Route.useLoaderData();
  return (
    <Entry
      id="work" n="02" kicker="OPEN WORK"
      title={<>A board of <em>real</em> work.</>}
      body={<>Passport holders publish listings with terms, deadline and skills. Filter by category, compensation or holders-only. <span className="text-ink">{fmt(stats.openOpportunities)} open</span> right now.</>}
      cta={<Go to="/discover" primary>Browse the board</Go>}
    >
      <ul className="flex flex-col gap-2">
        {featured.length > 0 ? featured.slice(0, 4).map((item, i) => {
          const due = deadlineCountdown(item.deadline);
          return (
            <li key={item.id} className="anim a-pop" style={{ animationDelay: `${i * 0.15}s`, animationIterationCount: 1 }}>
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
      id="review" n="03" kicker="APPLICATIONS & SUBMISSIONS"
      title={<>Apply, ship, get <em>accepted.</em></>}
      body={<>Apply to a listing, then submit evidence links for what you shipped. The publisher reviews it; acceptance writes XP to your passport. <span className="text-ink">{fmt(stats.acceptedWork)} accepted</span> to date.</>}
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
          <span className="ix">PASSPORT XP</span>
          <span className="anim a-flyv d4 absolute left-1/2 -top-12 tag tag-p" style={{ ["--dy" as string]: "44px" }}>+100 XP</span>
          <span className="text-small tabular-nums text-ink">accepted submission = 100 · application = 25</span>
        </div>
      </div>
    </Entry>
  );
}

/* ── 04 ladder ──────────────────────────────────────────── */
function LadderEntry() {
  const { leaders } = Route.useLoaderData();
  const max = Math.max(1, ...leaders.map((l) => l.xp));
  return (
    <Entry
      id="ladder" n="04" kicker="XP & RANKING"
      title={<>XP fills. Ranks <em>climb.</em></>}
      body={<>Guild XP comes from accepted work, applications, listings and your passport; onchain activity on Monad adds more. Five tiers, from {TIERS[0].name} to {TIERS[TIERS.length - 1].name}.</>}
      cta={<Go to="/ranking" primary>Full ranking</Go>}
    >
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_9rem]">
        <ol className="bento divide-y divide-line overflow-hidden">
          {leaders.length > 0 ? leaders.map((p, i) => (
            <li key={p.username}>
              <Link to="/passport/$username" params={{ username: p.username }} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-line/40">
                <span className={"flex size-6 items-center justify-center rounded-md text-label tabular-nums " + (i === 0 ? "bg-purple text-white" : "text-muted")}>{p.rank}</span>
                <Avatar name={p.displayName} url={p.avatarUrl} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small text-ink">{p.displayName}</span>
                  <span className="mt-1.5 block h-1 overflow-hidden rounded-full bg-line-strong">
                    <span className="anim a-fill block h-full rounded-full bg-purple" style={{ ["--from" as string]: "0.02", ["--to" as string]: String(p.xp / max), animationDelay: `${i * 0.15}s` }} />
                  </span>
                </span>
                <span className="w-16 text-right text-small tabular-nums text-ink">{formatXp(p.xp)} <span className="text-muted">XP</span></span>
              </Link>
            </li>
          )) : <li className="p-6 text-body">Nobody is ranked yet.</li>}
        </ol>
        {/* tier rungs with a climbing token */}
        <div className="bento relative hidden overflow-hidden p-3 sm:block" aria-label="Tiers">
          <ol className="flex h-full flex-col-reverse justify-between">
            {TIERS.map((t) => (
              <li key={t.name} className="flex items-center justify-between border-t border-line py-2 text-label first:border-t-0">
                <span className="text-body">{t.name}</span><span className="ix">{t.min}</span>
              </li>
            ))}
          </ol>
          <span className="anim a-climb absolute bottom-3 right-3 left-3 h-7 rounded-md border border-purple" style={{ ["--up" as string]: "-200%" }} aria-hidden="true" />
        </div>
      </div>
    </Entry>
  );
}

/* ── 05 chog ────────────────────────────────────────────── */
function ChogEntry() {
  const { people } = Route.useLoaderData();
  const holders = people.filter((p) => p.chogCount > 0);
  const tokenId = holders.find((h) => h.chogIds.length > 0)?.chogIds[0];
  return (
    <Entry
      id="chog" n="05" kicker="CHOG GENESIS PERKS"
      title={<>Hold a Chog, get the <em>boost.</em></>}
      body={<>Holding a Chog Genesis NFT is read live from the contract. Holders get a badge, +{Math.round(CHOG_BOOST_RATE * 100)}% guild XP (up to +{CHOG_BOOST_CAP}) and access to holders-only listings. <span className="text-ink">{holders.length} of {people.length}</span> ranked passports hold one.</>}
      cta={<a href={CHOG_EXPLORER_URL} target="_blank" rel="noreferrer" className="btn-ghost group inline-flex h-11 items-center gap-2 rounded-full px-5 text-small font-medium">View contract <span aria-hidden="true" className="arrow-slide">↗</span></a>}
    >
      <div className="diagram p-5 sm:p-8">
        <div className="flex items-center gap-4">
          {tokenId !== undefined ? (
            <img src={chogImageUrl(tokenId)} alt={`Chog Genesis #${tokenId}`} loading="lazy" width={64} height={64} className="anim a-pop size-16 rounded-2xl object-cover ring-1 ring-purple" />
          ) : (
            <span className="anim a-pop flex size-16 items-center justify-center rounded-2xl bg-purple text-2xl text-white">◆</span>
          )}
          <div>
            <span className="anim a-pop d1 tag chip-purple">◆ Chog holder</span>
            <p className="ix mt-2">ownerOf · 0xc96d…3763</p>
          </div>
        </div>
        <div className="mt-8">
          <div className="flex justify-between ix"><span>GUILD XP</span><span className="text-purple-ink">+10% boost</span></div>
          <div className="mt-2 flex h-3 overflow-hidden rounded-full bg-line-strong">
            <span className="block h-full w-[60%] bg-ink" />
            <span className="anim a-boost block h-full w-[6%] bg-purple" />
          </div>
          <p className="ix mt-2">capped at +{CHOG_BOOST_CAP} XP · onchain XP is never boosted</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="anim a-pop d2 tag chip-purple">◆ Chog holders only</span>
          <span className="anim a-pop d3 tag">listing gated by wallet</span>
        </div>
      </div>
    </Entry>
  );
}

/* ── 06 network ─────────────────────────────────────────── */
function NetworkEntry() {
  const { people, stats } = Route.useLoaderData();
  const rows = people.filter((p) => (p.txCount ?? 0) > 0);
  const blocks = rows.length > 0 ? [...rows, ...rows, ...rows, ...rows] : [];
  return (
    <Entry
      id="network" n="06" kicker="ONCHAIN PROOFS"
      title={<>Proof lives <em>onchain.</em></>}
      body={<>Each passport is tied to a Monad wallet. We read its transaction count from the chain and turn it into onchain XP. Members have <span className="text-ink">{fmt(stats.onchainTxs)} transactions</span> on Monad.</>}
      cta={<Go to="/network" primary>Network stats</Go>}
    >
      <div className="diagram overflow-hidden py-8">
        {blocks.length > 0 ? (
          <ul className="anim a-blocks flex w-max gap-2 px-2">
            {blocks.map((p, i) => (
              <li key={`${p.username}-${i}`} aria-hidden={i >= rows.length ? true : undefined} className="cell w-40 shrink-0 p-3">
                <p className="ix">BLOCK · TX</p>
                <p className="mt-2 truncate text-small text-ink">@{p.username}</p>
                <p className="mt-1 text-2xl font-medium tracking-[-0.04em] tabular-nums text-ink">{fmt(p.txCount)}</p>
                <span className="mt-2 block h-1 w-8 rounded-full bg-purple" />
              </li>
            ))}
          </ul>
        ) : <p className="px-6 text-body">Onchain counts are loading from the Monad RPC.</p>}
      </div>
    </Entry>
  );
}

/* ── 07 publish ─────────────────────────────────────────── */
function PublishEntry() {
  return (
    <Entry
      id="publish" n="07" kicker="PUBLISH WORK"
      title={<>Need help? <em>Post</em> it.</>}
      body={<>Any passport holder can publish a listing: title, terms, deadline, positions and skills, optionally gated to Chog holders. Then review applicants and submissions. Published listings earn {XP_RULES[2].points} XP once they count.</>}
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
    ["Claim a passport", "Sign once with your wallet."],
    ["Pick up work", "Apply to an open listing."],
    ["Submit evidence", "Links to what you shipped."],
    ["Earn rank", "Accepted work becomes XP."],
  ];
  return (
    <Entry
      id="how" n="08" kicker="HOW IT WORKS"
      title={<>Four steps, one <em>record.</em></>}
      body={<>Every XP value is computed from the database and the chain, never typed in. Monthly caps keep it fair.</>}
      cta={<><Go to="/how-it-works" primary>How it works</Go><Go to="/docs">Read the docs</Go></>}
    >
      <ol className="grid gap-2 sm:grid-cols-2">
        {steps.map(([t, b], i) => (
          <li key={t} className="bento anim a-pop p-5" style={{ animationDelay: `${i * 0.2}s`, animationIterationCount: 1 }}>
            <p className="ix text-purple-ink">0{i + 1}</p>
            <p className="mt-6 text-lead tracking-[-0.02em] text-ink">{t}</p>
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
    <section id="start" className="mt-28 grid gap-8 rounded-[1.25rem] bg-purple px-6 py-12 text-white sm:mt-40 sm:px-12 sm:py-16 md:grid-cols-[1fr_auto] md:items-end">
      <div>
        <p className="font-mono text-label text-white/70">09 · START</p>
        <h2 className="mt-4 max-w-2xl text-[clamp(2.25rem,1.4rem+3vw,4.5rem)] leading-[0.95] font-medium tracking-[-0.055em]">Your work deserves a <em className="italic">record.</em></h2>
      </div>
      <Link to="/passport" className="btn-white group inline-flex h-12 shrink-0 items-center gap-2.5 rounded-full px-6 text-small font-medium">
        {profile ? "Open your passport" : "Claim your passport"} <span aria-hidden="true" className="arrow-slide">→</span>
      </Link>
    </section>
  );
}
