import type { Sql } from "@/lib/db";
import type { Contributor, XpCounts } from "@/lib/ranking/xp";
import { computeGuildXp, type ListingEvent, type WorkEvent } from "@/lib/ranking/farming";

export type GuildStats = {
  passports: number;
  openOpportunities: number;
  acceptedWork: number;
};

type Row = {
  username: string;
  display_name: string;
  avatar_url: string | null;
  wallet_address: string;
  created_at: string;
};

const ISO = `'YYYY-MM-DD"T"HH24:MI:SS"Z"'`;

/** Accepted work events and published listings involving the given wallets (lowercase, indexed columns). */
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

/** Every public passport with its anti-farming guild XP; onchain data is filled in later. */
export async function listContributors(sql: Sql, now = Date.now()): Promise<Contributor[]> {
  const rows = await sql<Row>`
    select p.username, p.display_name, p.avatar_url, p.wallet_address, p.created_at::text as created_at
    from contributor_profiles p
    where p.visibility = 'public'
  `;
  const wallets = rows.map((row) => row.wallet_address.toLowerCase());
  const { work, listings } = await loadXpEvents(sql, wallets);
  const xp = computeGuildXp(wallets, work, listings, now);
  return rows.map((row) => {
    const wallet = row.wallet_address.toLowerCase();
    const result = xp.get(wallet)!;
    const counts: XpCounts = result.counts;
    return {
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      wallet,
      joined: row.created_at,
      counts,
      guildXp: result.xp,
      txCount: null,
      onchainXp: null,
    };
  });
}

export async function loadGuildStats(sql: Sql): Promise<GuildStats> {
  const rows = await sql<{ passports: unknown; open_opportunities: unknown; accepted_work: unknown }>`
    select
      (select count(*) from contributor_profiles where visibility = 'public') as passports,
      (select count(*) from opportunities where status = 'open') as open_opportunities,
      (select count(*) from work_submissions where status = 'accepted') as accepted_work
  `;
  const row = rows[0];
  return {
    passports: Number(row?.passports ?? 0),
    openOpportunities: Number(row?.open_opportunities ?? 0),
    acceptedWork: Number(row?.accepted_work ?? 0),
  };
}
