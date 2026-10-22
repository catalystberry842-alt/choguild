/**
 * Anti-farming guild XP. Raw counts are easy to farm (publish+close loops,
 * two wallets accepting each other's work), so XP is computed from events:
 *
 * - A published listing earns XP only if a different wallet had work or an
 *   application accepted on it, or it stayed open at least LISTING_MIN_OPEN_MS.
 *   At most LISTING_CAP_PER_PERIOD listings earn XP per period.
 * - Accepted work/applications are grouped by counterparty pair (unordered, so
 *   A→B and B→A share one counter). The nth job between the same two wallets
 *   earns PAIR_MULTIPLIERS[n] of its value; repeats beyond that earn nothing.
 * - Self-dealing (contributor == owner, or two Chogs held by the same wallet) earns nothing.
 * - Guild XP per wallet per PERIOD_MS window is capped at PERIOD_XP_CAP.
 */
export const PERIOD_MS = 30 * 24 * 60 * 60 * 1000;
export const PERIOD_XP_CAP = 400;
export const LISTING_MIN_OPEN_MS = 72 * 60 * 60 * 1000;
export const LISTING_CAP_PER_PERIOD = 4;
export const PAIR_MULTIPLIERS = [1, 0.5] as const;
export const POINTS = { submission: 100, application: 25, listing: 15, passport: 10 } as const;

export type WorkEvent = {
  kind: "submission" | "application";
  contributor: string;
  owner: string;
  opportunityId: string;
  /** ISO time the work/application was accepted. */
  at: string;
};

export type ListingEvent = {
  id: string;
  owner: string;
  publishedAt: string | null;
  /** Null while still open. */
  closedAt: string | null;
};

export type CreditedCounts = {
  acceptedSubmissions: number;
  acceptedApplications: number;
  publishedOpportunities: number;
  passport: number;
};

export type GuildXpResult = { xp: number; counts: CreditedCounts; seasonXp: number };

export type XpOptions = {
  /** True when two actors are held by the same wallet right now (Chog self-dealing). */
  sameHolder?: (a: string, b: string) => boolean;
  /** Start (ms) of the current season; XP credited at or after it also counts as season XP. */
  seasonStart?: number;
};

const pairKey = (a: string, b: string) => (a < b ? `${a}|${b}` : `${b}|${a}`);
const periodOf = (iso: string) => Math.floor(Date.parse(iso) / PERIOD_MS);

/** Computes credited XP for every wallet in one pass. Wallets must be lowercase. */
export function computeGuildXp(
  wallets: string[],
  work: WorkEvent[],
  listings: ListingEvent[],
  now = Date.now(),
  options: XpOptions = {},
): Map<string, GuildXpResult> {
  const sameHolder = options.sameHolder ?? (() => false);
  const seasonStart = options.seasonStart ?? Infinity;
  const out = new Map<string, GuildXpResult>();
  const items = new Map<string, { period: number; points: number; kind: keyof CreditedCounts; at: number }[]>();
  for (const wallet of wallets) items.set(wallet, []);

  const clean = work
    .map((event) => ({ ...event, contributor: event.contributor.toLowerCase(), owner: event.owner.toLowerCase() }))
    .filter((event) => event.contributor !== event.owner && !sameHolder(event.contributor, event.owner) && Number.isFinite(Date.parse(event.at)))
    .sort((a, b) => a.at.localeCompare(b.at));

  // One "job" = an opportunity between a contributor and an owner (application + its submission).
  const jobIndex = new Map<string, number>(); // `${contributor}|${opportunity}` -> nth job for that pair
  const pairJobs = new Map<string, number>();
  const creditedListings = new Set<string>();
  for (const event of clean) {
    const jobKey = `${event.contributor}|${event.opportunityId}`;
    let n = jobIndex.get(jobKey);
    if (n === undefined) {
      const key = pairKey(event.contributor, event.owner);
      n = pairJobs.get(key) ?? 0;
      pairJobs.set(key, n + 1);
      jobIndex.set(jobKey, n);
    }
    const multiplier = PAIR_MULTIPLIERS[n] ?? 0;
    if (multiplier <= 0) continue;
    creditedListings.add(event.opportunityId);
    items.get(event.contributor)?.push({
      period: periodOf(event.at),
      points: Math.round(POINTS[event.kind] * multiplier),
      kind: event.kind === "submission" ? "acceptedSubmissions" : "acceptedApplications",
      at: Date.parse(event.at),
    });
  }

  const perPeriodListings = new Map<string, number>();
  for (const listing of [...listings].sort((a, b) => (a.publishedAt ?? "").localeCompare(b.publishedAt ?? ""))) {
    if (!listing.publishedAt) continue;
    const owner = listing.owner.toLowerCase();
    const openedFor = (listing.closedAt ? Date.parse(listing.closedAt) : now) - Date.parse(listing.publishedAt);
    if (!creditedListings.has(listing.id) && !(openedFor >= LISTING_MIN_OPEN_MS)) continue;
    const period = periodOf(listing.publishedAt);
    const key = `${owner}|${period}`;
    const used = perPeriodListings.get(key) ?? 0;
    if (used >= LISTING_CAP_PER_PERIOD) continue;
    perPeriodListings.set(key, used + 1);
    items.get(owner)?.push({ period, points: POINTS.listing, kind: "publishedOpportunities", at: Date.parse(listing.publishedAt) });
  }

  for (const wallet of wallets) {
    const counts: CreditedCounts = { acceptedSubmissions: 0, acceptedApplications: 0, publishedOpportunities: 0, passport: 1 };
    const byPeriod = new Map<number, number>();
    let xp = POINTS.passport;
    let seasonXp = 0;
    for (const item of items.get(wallet) ?? []) {
      const used = byPeriod.get(item.period) ?? 0;
      const add = Math.min(item.points, PERIOD_XP_CAP - used);
      if (add <= 0) continue;
      byPeriod.set(item.period, used + add);
      xp += add;
      if (item.at >= seasonStart) seasonXp += add;
      counts[item.kind] += 1;
    }
    out.set(wallet, { xp, counts, seasonXp });
  }
  return out;
}
