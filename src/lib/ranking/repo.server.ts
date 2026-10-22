import type { Sql } from "@/lib/db";
import type { Contributor, XpCounts } from "@/lib/ranking/xp";
import { computeGuildXp, type ListingEvent, type WorkEvent } from "@/lib/ranking/farming";
import { seasonFor } from "@/lib/quests/quests";

export type GuildStats = {
  passports: number;
  openOpportunities: number;
  acceptedWork: number;
  questsToday: number;
};

type Row = {
  username: string;
  display_name: string;
  avatar_url: string | null;
  wallet_address: string;
  created_at: string;
};

const ISO = `'YYYY-MM-DD"T"HH24:MI:SS"Z"'`;

/** Accepted work events and published listings involving the given actors (indexed columns). */
export async function loadXpEvents(sql: Sql, wallets: string[]): Promise<{ work: WorkEvent[]; listings: ListingEvent[] }> {
  if (wallets.length === 0) return { work: [], listings: [] };
  const [subs, apps, listings] = await Promise.all([
    sql.query<{ contributor: string; owner: string; opportunity_id: string; at: string }>(
      `select w.contributor_wallet as contributor, o.owner_wallet as owner, o.id as opportunity_id,
        to_char(coalesce((select min(e.created_at) from submission_events e where e.submission_id = w.id and e.to_status = 'accepted'), w.updated_at) at time zone 'UTC', ${ISO}) as at
       from work_submissions w join opportunities o on o.id = w.opportunity_id
       where w.status = 'accepted' and (w.contributor_wallet = any($1) or o.owner_wallet = any($1))`,
      [wallets],
    ),
    sql.query<{ contributor: string; owner: string; opportunity_id: string; at: string }>(
      `select a.contributor_wallet as contributor, o.owner_wallet as owner, o.id as opportunity_id,
        to_char(coalesce((select min(e.created_at) from application_events e where e.application_id = a.id and e.status = 'accepted'), a.updated_at) at time zone 'UTC', ${ISO}) as at
       from applications a join opportunities o on o.id = a.opportunity_id
       where a.status = 'accepted' and (a.contributor_wallet = any($1) or o.owner_wallet = any($1))`,
      [wallets],
    ),
    sql.query<{ id: string; owner: string; published_at: string | null; closed_at: string | null }>(
      `select id, owner_wallet as owner,
        to_char(coalesce(published_at, created_at) at time zone 'UTC', ${ISO}) as published_at,
        to_char(closed_at at time zone 'UTC', ${ISO}) as closed_at
       from opportunities where status <> 'draft' and owner_wallet = any($1)`,
      [wallets],
    ),
  ]);
  return {
    work: [
      ...subs.map((r) => ({ kind: "submission" as const, contributor: r.contributor, owner: r.owner, opportunityId: r.opportunity_id, at: r.at })),
      ...apps.map((r) => ({ kind: "application" as const, contributor: r.contributor, owner: r.owner, opportunityId: r.opportunity_id, at: r.at })),
    ],
    listings: listings.map((r) => ({ id: r.id, owner: r.owner, publishedAt: r.published_at, closedAt: r.closed_at })),
  };
}

/**
 * Every public Chog passport with anti-farming XP, quest XP and season XP.
 * `holderOf` maps a token id to its current owner (snapshot) so Chogs in one wallet can't farm each other.
 */
export async function listContributors(
  sql: Sql,
  options: { now?: number; holderOf?: (chogId: number) => string | null } = {},
): Promise<Contributor[]> {
  const now = options.now ?? Date.now();
  const rows = await sql<Row>`
    select p.username, p.display_name, p.avatar_url, p.wallet_address, p.created_at::text as created_at
    from contributor_profiles p
    where p.visibility = 'public' and p.wallet_address like 'chog:%'
  `;
  const actors = rows.map((row) => row.wallet_address);
  const { work, listings } = await loadXpEvents(sql, actors);
  const holderOf = options.holderOf;
  const sameHolder = holderOf
    ? (a: string, b: string) => {
        if (!a.startsWith("chog:") || !b.startsWith("chog:")) return false;
        const ha = holderOf(Number(a.slice(5)));
        return Boolean(ha && ha === holderOf(Number(b.slice(5))));
      }
    : undefined;
  const season = seasonFor(now);
  const xp = computeGuildXp(actors, work, listings, now, { sameHolder, seasonStart: season.start });
  const { questTotals } = await import("@/lib/quests/repo.server");
  const quests = await questTotals(sql, now);
  return rows.map((row) => {
    const chogId = Number(row.wallet_address.slice(5));
    const result = xp.get(row.wallet_address)!;
    const q = quests.get(chogId) ?? { total: 0, season: 0, streak: 0 };
    const counts: XpCounts = result.counts;
    return {
      chogId,
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      wallet: row.wallet_address,
      joined: row.created_at,
      counts,
      guildXp: result.xp,
      questXp: q.total,
      seasonXp: result.seasonXp + q.season,
      streak: q.streak,
    };
  });
}

export async function loadGuildStats(sql: Sql): Promise<GuildStats> {
  const rows = await sql<{ passports: unknown; open_opportunities: unknown; accepted_work: unknown; quests_today: unknown }>`
    select
      (select count(*) from contributor_profiles where visibility = 'public' and wallet_address like 'chog:%') as passports,
      (select count(*) from opportunities where status = 'open') as open_opportunities,
      (select count(*) from work_submissions where status = 'accepted') as accepted_work,
      (select count(*) from chog_quests where day = (now() at time zone 'UTC')::date) as quests_today
  `;
  const row = rows[0];
  return {
    passports: Number(row?.passports ?? 0),
    openOpportunities: Number(row?.open_opportunities ?? 0),
    acceptedWork: Number(row?.accepted_work ?? 0),
    questsToday: Number(row?.quests_today ?? 0),
  };
}
