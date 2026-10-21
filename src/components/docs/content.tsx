import type { ReactNode } from "react";
import { CHOG_BOOST_CAP, CHOG_BOOST_RATE, CHOG_CONTRACT } from "@/lib/chog/chog";
import { LISTING_CAP_PER_PERIOD, PERIOD_XP_CAP, POINTS } from "@/lib/ranking/farming";
import { ONCHAIN_XP_CAP, TIERS } from "@/lib/ranking/xp";
import { AVATAR_MAX_BYTES, AVATAR_SIZE, AVATAR_SOURCE_MAX_BYTES } from "@/lib/passport/avatar";

export type DocSection = { id: string; title: string; body: ReactNode };
export type DocPage = { slug: string; title: string; lead: string; sections: DocSection[] };

const C = ({ children }: { children: ReactNode }) => <code className="rounded-md border border-line bg-secondary px-1.5 py-0.5 text-[0.85em] text-ink">{children}</code>;
const Ul = ({ items }: { items: ReactNode[] }) => (
  <ul className="flex flex-col gap-2">{items.map((it, i) => <li key={i} className="flex gap-3"><span className="sq mt-2 shrink-0" aria-hidden="true" /><span>{it}</span></li>)}</ul>
);

export const DOCS: DocPage[] = [
  {
    slug: "overview",
    title: "Whitepaper",
    lead: "Choguild is a contributor guild on Monad: a wallet-signed passport, a board of open work, and a public, anti-farming XP ladder built from reviewed contributions.",
    sections: [
      { id: "problem", title: "The problem", body: <p>Contributors in an ecosystem do real work across Discords, docs and repos, but there is no shared record of what was asked for, who did it, and whether it was accepted. Self-reported portfolios are easy to inflate and hard to verify.</p> },
      { id: "approach", title: "The approach", body: <Ul items={[
        <>An identity anchored to a Monad wallet: the <b className="text-ink">passport</b>. Editing it requires a signed message, not a transaction.</>,
        <>A <b className="text-ink">board</b> where passport holders publish listings with terms, deadline and skills.</>,
        <>A <b className="text-ink">review loop</b>: applications and submissions are accepted or rejected by the publisher.</>,
        <>A <b className="text-ink">ladder</b>: XP is computed from accepted events and onchain activity, with caps that make farming unprofitable.</>,
      ]} /> },
      { id: "principles", title: "Principles", body: <Ul items={[
        "Real data only. Every number on the site comes from the database or the Monad chain; nothing is typed in by hand.",
        "No custody. Choguild never holds funds or keys; signing in spends no gas.",
        "Fair by construction. Self-dealing earns nothing, repeat pairs decay, and guild XP is capped per 30 days.",
        "Open source under the MIT license.",
      ]} /> },
      { id: "stack", title: "Stack", body: <p>TanStack Start with React 19 and Tailwind v4, deployed on Vercel. Data lives in Postgres (Neon). Wallets connect through wagmi's injected connector (EIP-6963 discovery) on Monad mainnet, chain id <C>143</C>.</p> },
    ],
  },
  {
    slug: "how-it-works",
    title: "How it works",
    lead: "Four steps turn a wallet into a ranked contributor.",
    sections: [
      { id: "steps", title: "The loop", body: <ol className="flex flex-col gap-3">{[
        ["Claim a passport", "Connect a browser wallet and sign one message."],
        ["Pick up work", "Apply to an open listing on the board."],
        ["Submit evidence", "Send links to what you shipped; the publisher reviews it."],
        ["Earn rank", "Accepted work becomes XP and moves you up the ladder."],
      ].map(([t, b], i) => <li key={t} className="flex gap-4"><span className="ix w-6 text-purple-ink">0{i + 1}</span><span><b className="text-ink">{t}.</b> {b}</span></li>)}</ol> },
      { id: "roles", title: "Two roles, one passport", body: <p>Every passport can both publish and contribute. Publishers review the applications and submissions on their own listings; contributors track theirs under Applications and Submissions. You can never accept your own work.</p> },
    ],
  },
  {
    slug: "passport",
    title: "Passport",
    lead: "Your identity in the guild, owned by your wallet.",
    sections: [
      { id: "connect", title: "Connecting a wallet", body: <Ul items={[
        <>The header shows a single <b className="text-ink">Connect wallet</b> button. Browser wallets are discovered automatically (EIP-6963), with a generic injected fallback.</>,
        "Coinbase, WalletConnect and Phantom connectors are not offered.",
        "If no wallet is detected after you tap, mobile users get deep links to open the page in a wallet app such as MetaMask.",
      ]} /> },
      { id: "sign-in", title: "Signing in", body: <p>Sign-in uses Sign-In with Ethereum. The message states: <i>“This signature is not a transaction, does not spend funds, and does not prove you are a particular person.”</i> A connected address alone cannot edit a profile. Sessions last 7 days.</p> },
      { id: "profile", title: "Profile and avatar", body: <Ul items={[
        "Display name, username, bio, skills, interests and links (for example X or GitHub).",
        <>Avatar is an image upload with a live preview: PNG, JPEG, WebP or GIF up to {Math.round(AVATAR_SOURCE_MAX_BYTES / 1024 / 1024)} MB, resized in the browser to {AVATAR_SIZE}×{AVATAR_SIZE} and stored under {Math.round(AVATAR_MAX_BYTES / 1000)} KB.</>,
        "Chog holders can pick one of their Chogs as the avatar; ownership is re-checked live with ownerOf.",
        <>Saving a public passport earns a one-time {POINTS.passport} XP.</>,
      ]} /> },
    ],
  },
  {
    slug: "listings",
    title: "Listings & applications",
    lead: "Publishing work, applying, submitting and reviewing.",
    sections: [
      { id: "publish", title: "Publishing a listing", body: <p>Any passport holder can publish: title, project, category (content writing, development, design, research, community, marketing, other), compensation (paid, token-based, grant-funded, revenue-sharing, unpaid collaboration), deadline, number of positions, required and preferred skills. A listing can be marked <b className="text-ink">Chog holders only</b>. Listing states are Draft, Open, Closed and Filled.</p> },
      { id: "apply", title: "Applying", body: <p>Applications move through Submitted, Under review, Shortlisted, Accepted, Rejected or Withdrawn. An accepted application earns {POINTS.application} XP.</p> },
      { id: "submit", title: "Submitting work", body: <p>Submissions carry evidence links and are versioned. Their states are Draft, Submitted, Under review, Accepted, Changes requested and Rejected. After changes are requested you can resubmit. An accepted submission earns {POINTS.submission} XP.</p> },
    ],
  },
  {
    slug: "xp",
    title: "XP & ranking",
    lead: "How the ladder is computed, and why it is hard to farm.",
    sections: [
      { id: "points", title: "Points", body: <Ul items={[
        <>Accepted submission: <b className="text-ink">{POINTS.submission} XP</b></>,
        <>Accepted application: <b className="text-ink">{POINTS.application} XP</b></>,
        <>Published listing: <b className="text-ink">{POINTS.listing} XP</b>, once another wallet's work or application is accepted on it or it stays open 72 hours; up to {LISTING_CAP_PER_PERIOD} per 30 days.</>,
        <>Saved passport: <b className="text-ink">{POINTS.passport} XP</b>, once.</>,
      ]} /> },
      { id: "anti-farming", title: "Anti-farming rules", body: <Ul items={[
        "Self-dealing (contributor is the publisher) earns nothing.",
        "Jobs between the same two wallets decay: the first earns full value, the second half, then nothing. A→B and B→A share one counter.",
        <>Guild XP is capped at {PERIOD_XP_CAP} per wallet per 30 days.</>,
      ]} /> },
      { id: "tiers", title: "Tiers", body: <Ul items={TIERS.map((t) => <><b className="text-ink">{t.name}</b> from {t.min} XP: {t.blurb}</>)} /> },
      { id: "views", title: "Ranking views", body: <p>The ranking can be sorted Overall (guild + onchain XP), by Guild work, or by Onchain activity.</p> },
    ],
  },
  {
    slug: "onchain",
    title: "Onchain proofs",
    lead: "What we read from Monad and how it counts.",
    sections: [
      { id: "tx", title: "Transaction count", body: <p>For each passport wallet we read the number of transactions it has sent on Monad mainnet. Onchain XP is <C>10 × √txs</C>, rounded and capped at {ONCHAIN_XP_CAP}, so heavy activity is worth about one accepted job and reviewed work still leads.</p> },
      { id: "availability", title: "When the chain is slow", body: <p>Pages never block on the RPC: persisted counts are used first with a short budget for fresh reads. If the RPC cannot answer, the value shows as unavailable rather than a misleading zero.</p> },
      { id: "network", title: "Network page", body: <p>The Network page shows live Monad facts and the guild's combined onchain activity.</p> },
    ],
  },
  {
    slug: "chog",
    title: "Chog perks",
    lead: "Benefits for holders of the Chog Genesis NFT.",
    sections: [
      { id: "contract", title: "The contract", body: <p>Holdings are read live from Chog Genesis at <C>{CHOG_CONTRACT}</C> on Monad.</p> },
      { id: "perks", title: "Perks", body: <Ul items={[
        "A Chog holder badge on your passport and in the ranking.",
        <>+{Math.round(CHOG_BOOST_RATE * 100)}% guild XP, rounded and capped at +{CHOG_BOOST_CAP}. Onchain XP is never boosted.</>,
        "Access to listings marked Chog holders only.",
        "Use one of your Chogs as your passport avatar.",
      ]} /> },
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    lead: "Short answers to common questions.",
    sections: [
      { id: "gas", title: "Does signing in cost gas?", body: <p>No. It is a signed message, not a transaction.</p> },
      { id: "custody", title: "Does Choguild hold funds?", body: <p>No. Payment terms are agreed between publisher and contributor; Choguild records the work, not the money.</p> },
      { id: "wallets", title: "Which wallets work?", body: <p>Any injected browser wallet such as MetaMask or Rabby. Coinbase, WalletConnect and Phantom connectors are not offered.</p> },
      { id: "xp-edit", title: "Can XP be edited by hand?", body: <p>No. XP is recomputed from accepted events and the chain.</p> },
      { id: "source", title: "Is it open source?", body: <p>Yes, under the MIT license on GitHub.</p> },
    ],
  },
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
