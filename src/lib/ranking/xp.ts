/** How XP is earned. Shared by the ranking query and the How it works page. */
export const XP_RULES = [
  { key: "acceptedSubmissions", label: "Accepted submission", points: 100, detail: "Work you submitted was reviewed and accepted." },
  { key: "acceptedApplications", label: "Accepted application", points: 25, detail: "A publisher accepted you onto their opportunity." },
  { key: "publishedOpportunities", label: "Published opportunity", points: 15, detail: "You posted open work to the board (drafts do not count)." },
  { key: "passport", label: "Saved passport", points: 10, detail: "One-time bonus for saving a public Chog Passport." },
] as const;

export type XpKey = (typeof XP_RULES)[number]["key"];
export type XpCounts = Record<XpKey, number>;

export const TIERS = [
  { name: "Hatchling", min: 0, blurb: "Fresh out of the egg, so save a passport to start." },
  { name: "Apprentice", min: 50, blurb: "On the board and getting picked." },
  { name: "Artisan", min: 150, blurb: "Shipped and accepted work, more than once." },
  { name: "Guildmaster", min: 400, blurb: "A name people look for on the board." },
  { name: "Legend", min: 1000, blurb: "Chog royalty, and the crown fits." },
] as const;

export type Tier = (typeof TIERS)[number];

export function xpFor(counts: XpCounts): number {
  return XP_RULES.reduce((total, rule) => total + rule.points * Math.max(0, counts[rule.key] ?? 0), 0);
}

export function tierFor(xp: number): { tier: Tier; next: Tier | null; progress: number } {
  let index = 0;
  for (let i = 0; i < TIERS.length; i += 1) if (xp >= TIERS[i].min) index = i;
  const tier = TIERS[index];
  const next = TIERS[index + 1] ?? null;
  const progress = next ? (xp - tier.min) / (next.min - tier.min) : 1;
  return { tier, next, progress: Math.min(1, Math.max(0, progress)) };
}

export function formatXp(xp: number): string {
  return new Intl.NumberFormat("en-US").format(xp);
}

/**
 * Onchain XP: 10 × √(transactions sent on Monad), capped at 150. Heavy onchain
 * activity is worth about one accepted job, so reviewed guild work still leads.
 */
export const ONCHAIN_XP_CAP = 150;

export function onchainXpFor(txCount: number): number {
  if (!Number.isFinite(txCount) || txCount <= 0) return 0;
  return Math.min(ONCHAIN_XP_CAP, Math.round(10 * Math.sqrt(txCount)));
}

export type RankBy = "overall" | "guild" | "onchain";

export const RANK_BY: { id: RankBy; label: string }[] = [
  { id: "overall", label: "Overall" },
  { id: "guild", label: "Guild work" },
  { id: "onchain", label: "Onchain" },
];

export type Contributor = {
  username: string;
  displayName: string;
  avatarUrl: string | null;
  wallet: string;
  joined: string;
  counts: XpCounts;
  guildXp: number;
  /** Null when the Monad RPC could not be reached for this wallet. */
  txCount: number | null;
  onchainXp: number | null;
};

export type RankedContributor = Contributor & { rank: number; xp: number; tier: string };

function scoreFor(person: Contributor, by: RankBy): number {
  if (by === "guild") return person.guildXp;
  if (by === "onchain") return person.onchainXp ?? 0;
  return person.guildXp + (person.onchainXp ?? 0);
}

/** Sorts by the chosen score; ties go to overall XP, then whoever joined first. Tier always uses overall XP. */
export function rankContributors(people: Contributor[], by: RankBy, limit = 50): RankedContributor[] {
  return [...people]
    .sort(
      (a, b) =>
        scoreFor(b, by) - scoreFor(a, by) ||
        scoreFor(b, "overall") - scoreFor(a, "overall") ||
        a.joined.localeCompare(b.joined),
    )
    .slice(0, limit)
    .map((person, index) => ({
      ...person,
      rank: index + 1,
      xp: scoreFor(person, by),
      tier: tierFor(scoreFor(person, "overall")).tier.name,
    }));
}
