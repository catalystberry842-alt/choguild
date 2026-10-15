import type { Sql } from "@/lib/db";
import { xpFor, type Contributor, type XpCounts } from "@/lib/ranking/xp";

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
  accepted_submissions: number | string | bigint;
  accepted_applications: number | string | bigint;
  published_opportunities: number | string | bigint;
};

/** Every public passport with its guild activity counts; onchain data is filled in later. */
export async function listContributors(sql: Sql): Promise<Contributor[]> {
  const rows = await sql<Row>`
    select p.username, p.display_name, p.avatar_url, p.wallet_address, p.created_at::text as created_at,
      (select count(*) from work_submissions s
        where lower(s.contributor_wallet) = lower(p.wallet_address) and s.status = 'accepted') as accepted_submissions,
      (select count(*) from applications a
        where lower(a.contributor_wallet) = lower(p.wallet_address) and a.status = 'accepted') as accepted_applications,
      (select count(*) from opportunities o
        where lower(o.owner_wallet) = lower(p.wallet_address) and o.status <> 'draft') as published_opportunities
    from contributor_profiles p
    where p.visibility = 'public'
  `;
  return rows.map((row) => {
    const counts: XpCounts = {
      acceptedSubmissions: Number(row.accepted_submissions),
      acceptedApplications: Number(row.accepted_applications),
      publishedOpportunities: Number(row.published_opportunities),
      passport: 1,
    };
    return {
      username: row.username,
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      wallet: row.wallet_address.toLowerCase(),
      joined: row.created_at,
      counts,
      guildXp: xpFor(counts),
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
