import type { ReactNode } from "react";
import { CHOG_CONTRACT, CHOG_SUPPLY, CHOG_TOKEN } from "@/lib/chog/chog";
import { LISTING_CAP_PER_PERIOD, PERIOD_XP_CAP, POINTS } from "@/lib/ranking/farming";
import { TIERS } from "@/lib/ranking/xp";
import { QUESTS, STREAK_BONUS_CAP } from "@/lib/quests/quests";

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
    lead: "Choguild is a work guild on Monad where each Chog Genesis NFT is the member. Its passport, XP, tier, rank and work history live on the token and travel with it.",
    sections: [
      { id: "problem", title: "The problem", body: <p>Most NFT utility is a badge or a discount: remove the NFT and the product still works. And contributor reputation is stuck to wallets, so it can't be earned, carried or handed on as an asset.</p> },
      { id: "approach", title: "The approach: the Chog is the member", body: <Ul items={[
        <>Every record is keyed to <C>chog:&lt;tokenId&gt;</C>, never to a wallet. Remove the NFT and there is no member, no passport, no listing, no rank.</>,
        <>Whoever owns the token right now acts as it. Ownership is read live with <C>ownerOf</C> on Monad before every write.</>,
        <>On transfer the new holder inherits the Chog's rank and history. Each Chog's record is public at <C>/chog/:id</C>.</>,
        <>Chogs post listings, other Chogs apply and submit evidence, and the poster's Chog reviews it. The leaderboard ranks Chogs.</>,
        <>A daily layer keeps Chogs coming back: quests, streaks, tier level-ups and a weekly season.</>,
        <>Anyone can tip a Chog's current holder in <b className="text-ink">$CHOG</b> (<C>{CHOG_TOKEN}</C>) from its record page: a direct wallet-to-wallet token transfer, no escrow.</>,
      ]} /> },
      { id: "principles", title: "Principles", body: <Ul items={[
        "Real data only. Every number comes from recorded events or live chain reads.",
        "No custody. Choguild never holds funds or keys; signing in spends no gas.",
        "Fair by construction. Self-dealing earns nothing, including between Chogs in one wallet; repeat pairs decay; XP is capped per 30 days.",
        "Open source under the MIT license.",
      ]} /> },
      { id: "stack", title: "Stack", body: <p>TanStack Start with React 19 and Tailwind v4 on Vercel, Postgres (Neon). Wallets connect through wagmi's injected connector on Monad mainnet, chain id <C>143</C>. Chog Genesis is <C>{CHOG_CONTRACT}</C> ({CHOG_SUPPLY} tokens).</p> },
    ],
  },
  {
    slug: "how-it-works",
    title: "How it works",
    lead: "From holding a Chog to a ranked, tradable record.",
    sections: [
      { id: "steps", title: "The loop", body: <Ul items={[
        <><b className="text-ink">Act as your Chog.</b> Sign one free message, then pick a Chog you hold. A wallet with several Chogs chooses one at a time.</>,
        <><b className="text-ink">Save its passport.</b> Name, bio, skills and links, saved on the token. The face is always the Chog's own art.</>,
        <><b className="text-ink">Quest daily.</b> Check in, scout a listing, size up a rival, and keep the streak.</>,
        <><b className="text-ink">Take work.</b> Apply to listings other Chogs posted and submit evidence.</>,
        <><b className="text-ink">Climb.</b> Accepted work becomes XP on the Chog and moves it up the leaderboard.</>,
      ]} /> },
      { id: "view-only", title: "No Chog, view only", body: <p>A wallet without a Chog can sign in and browse every page, listing and record, but can't publish, apply, review, quest or save a passport.</p> },
      { id: "transfer", title: "When a Chog changes hands", body: <p>The old holder's session drops the Chog on its next request (ownerOf no longer matches). The new holder signs in, picks it, and inherits its passport, XP, tier, streak and history. They can edit the passport text.</p> },
    ],
  },
  {
    slug: "passport",
    title: "Chog passport",
    lead: "The profile that lives on a Chog.",
    sections: [
      { id: "connect", title: "Connecting a wallet", body: <Ul items={[
        <>The header shows one <b className="text-ink">Connect wallet</b> button. Browser wallets are discovered automatically (EIP-6963).</>,
        "Coinbase, WalletConnect and Phantom connectors are not offered.",
      ]} /> },
      { id: "sign-in", title: "Signing in", body: <p>Sign-in uses Sign-In with Ethereum. The signature is not a transaction and spends nothing. Sessions last 7 days; the acting Chog is re-verified on every action.</p> },
      { id: "card", title: "The Chog card", body: <p>Each Chog's card uses its real token image. Its frame, title and glow evolve by tier, from a plain Hatchling frame to a glowing Legend frame. When a Chog reaches a new tier, its holder sees a level-up card with confetti.</p> },
      { id: "migration", title: "Wallet passports from before", body: <p>Passports created before the Chog model were mapped to the wallet's lowest-numbered Chog where the last holder snapshot showed one. Others were archived; if that wallet later acts as a Chog with no passport, the old passport and its history move onto it.</p> },
    ],
  },
  {
    slug: "quests",
    title: "Quests, streaks & seasons",
    lead: "The daily layer.",
    sections: [
      { id: "quests", title: "Daily quests", body: <Ul items={QUESTS.map((q) => <><b className="text-ink">{q.label}</b> (+{q.xp} XP): {q.detail}</>)} /> },
      { id: "streak", title: "Streaks", body: <p>Consecutive daily check-ins build a streak. Each check-in earns +1 XP per streak day on top of the base, up to +{STREAK_BONUS_CAP}. Days reset at 00:00 UTC.</p> },
      { id: "limits", title: "Limits", body: <p>Each quest counts once per Chog per day, and once per wallet per day, so holding many Chogs doesn't multiply quest XP. Scouting your own listing or visiting a Chog in your own wallet doesn't count.</p> },
      { id: "seasons", title: "Weekly seasons", body: <p>Seasons run Monday 00:00 UTC to the next Monday; Season 1 began 19 Oct 2026. Season XP is everything credited that week (work, listings, quests). The season leaderboard starts from zero each week; all-time XP keeps counting.</p> },
      { id: "share", title: "Rank cards", body: <p>Every ranked Chog's page draws a 1200×675 rank card (art, tier frame, rank, season rank, XP, streak) to download or share, and opens a prefilled post on X linking the Chog's record.</p> },
    ],
  },
  {
    slug: "xp",
    title: "XP & ranking",
    lead: "How the leaderboard is computed, and why it is hard to farm.",
    sections: [
      { id: "points", title: "Points", body: <Ul items={[
        <>Accepted submission: <b className="text-ink">{POINTS.submission} XP</b></>,
        <>Accepted application: <b className="text-ink">{POINTS.application} XP</b></>,
        <>Published listing: <b className="text-ink">{POINTS.listing} XP</b>, once another Chog's work is accepted on it or it stays open 72 hours; up to {LISTING_CAP_PER_PERIOD} per 30 days.</>,
        <>Saved passport: <b className="text-ink">{POINTS.passport} XP</b>, once.</>,
        <>Daily quests: see Quests.</>,
      ]} /> },
      { id: "anti-farming", title: "Anti-farming rules", body: <Ul items={[
        "Self-dealing earns nothing: a Chog can't accept its own work.",
        "Chogs held by the same wallet can't apply to, shortlist, accept or review each other, and any such event earns no XP.",
        "Jobs between the same two Chogs decay: full value, then half, then nothing. A→B and B→A share one counter.",
        <>Work and listing XP is capped at {PERIOD_XP_CAP} per Chog per 30 days.</>,
      ]} /> },
      { id: "tiers", title: "Tiers", body: <Ul items={TIERS.map((t) => <><b className="text-ink">{t.name}</b> from {t.min} XP: {t.blurb}</>)} /> },
      { id: "views", title: "Leaderboard views", body: <p>All time (work + quests) or This season (this week only).</p> },
    ],
  },
  {
    slug: "faq",
    title: "FAQ",
    lead: "Short answers to common questions.",
    sections: [
      { id: "gas", title: "Does signing in cost gas?", body: <p>No. It is a signed message, not a transaction.</p> },
      { id: "custody", title: "Does Choguild hold funds?", body: <p>No. Payment terms are agreed between the Chogs' holders; Choguild records the work, not the money.</p> },
      { id: "wallets", title: "Which wallets work?", body: <p>Any injected browser wallet such as MetaMask or Rabby.</p> },
      { id: "xp-edit", title: "Can XP be edited by hand?", body: <p>No. XP is recomputed from recorded events and the chain.</p> },
      { id: "source", title: "Is it open source?", body: <p>Yes, under the MIT license on GitHub.</p> },
    ],
  },
];

export const docBySlug = (slug: string) => DOCS.find((d) => d.slug === slug);
