
/** How XP is earned. Shared by the ranking query and the How it works page. */
export const XP_RULES = [
  { key: "acceptedSubmissions", label: "Accepted submission", points: 100, detail: "Work you submitted was reviewed and accepted. Repeat jobs between the same two Chogs earn half, then nothing. Chogs from one wallet earn nothing from each other." },
  { key: "acceptedApplications", label: "Accepted application", points: 25, detail: "A publisher accepted you onto their opportunity. Same repeat rule as submissions." },
  { key: "publishedOpportunities", label: "Published opportunity", points: 15, detail: "Counts once someone else's work is accepted on it or it stays open 3 days. Up to 4 a month." },
  { key: "passport", label: "Saved passport", points: 10, detail: "One-time bonus for saving a public passport for your Chog." },
] as const;

/** Guild XP from work and listings is capped per Chog per 30 days. */
export const MONTHLY_XP_CAP = 400;

export type XpKey = (typeof XP_RULES)[number]["key"];
export type XpCounts = Record<XpKey, number>;

export const TIERS = [
  { name: "Hatchling", min: 0, blurb: "Fresh out of the egg. Save a passport and check in." },
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

export type RankBy = "overall" | "season";

export const RANK_BY: { id: RankBy; label: string }[] = [
  { id: "overall", label: "All time" },
  { id: "season", label: "This season" },
];

/** One Chog on the ladder. `wallet` is the actor key `chog:<id>`. */
export type Contributor = {
  chogId: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  wallet: string;
  joined: string;
  counts: XpCounts;
  /** Work + listings + passport XP (anti-farming applied). */
  guildXp: number;
  /** Lifetime daily-quest XP. */
  questXp: number;
  /** XP credited in the current weekly season (work + quests). */
  seasonXp: number;
  streak: number;
};

export type RankedContributor = Contributor & { rank: number; xp: number; tier: string };

export function totalXp(person: Pick<Contributor, "guildXp" | "questXp">): number {
  return person.guildXp + person.questXp;
}

function scoreFor(person: Contributor, by: RankBy): number {
  return by === "season" ? person.seasonXp : totalXp(person);
}

/** Sorts by the chosen score; ties go to all-time XP, then whoever joined first. Tier always uses all-time XP. */
export function rankContributors(people: Contributor[], by: RankBy, limit = 50): RankedContributor[] {
  return [...people]
    .sort((a, b) => scoreFor(b, by) - scoreFor(a, by) || totalXp(b) - totalXp(a) || a.joined.localeCompare(b.joined))
    .slice(0, limit)
    .map((person, index) => ({ ...person, rank: index + 1, xp: scoreFor(person, by), tier: tierFor(totalXp(person)).tier.name }));
}
