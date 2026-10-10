import type { Sql } from "@/lib/db";
import { tierFor, xpFor, type XpCounts } from "@/lib/ranking/xp";

export type RankedContributor = {
  rank: number;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  skills: string[];
  xp: number;
  tier: string;
  counts: XpCounts;
};

export type GuildStats = {
  passports: number;
  openOpportunities: number;
  acceptedWork: number;
};

type Row = {
  username: string;
  display_name: string;
  avatar_url: string | null;
  skills: unknown;
  created_at: string;
  accepted_submissions: number | string | bigint;
  accepted_applications: number | string | bigint;
  published_opportunities: number | string | bigint;
};

function skillsOf(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      return skillsOf(JSON.parse(value) as unknown);
    } catch {
      return [];
    }
  }
  return [];
}

/** Public profiles ranked by XP; ties go to whoever joined first. */
export async function listRanking(sql: Sql, limit = 50): Promise<RankedContributor[]> {
  const rows = await sql<Row>`
    select p.username, p.display_name, p.avatar_url, p.skills, p.created_at::text as created_at,
      (select count(*) from work_submissions s
        where lower(s.contributor_wallet) = lower(p.wallet_address) and s.status = 'accepted') as accepted_submissions,
      (select count(*) from applications a
        where lower(a.contributor_wallet) = lower(p.wallet_address) and a.status = 'accepted') as accepted_applications,
      (select count(*) from opportunities o
        where lower(o.owner_wallet) = lower(p.wallet_address) and o.is_demo = false and o.status <> 'draft') as published_opportunities
    from contributor_profiles p
    where p.visibility = 'public'
  `;
  return rows
    .map((row) => {
      const counts: XpCounts = {
        acceptedSubmissions: Number(row.accepted_submissions),
        acceptedApplications: Number(row.accepted_applications),
        publishedOpportunities: Number(row.published_opportunities),
        passport: 1,
      };
      const xp = xpFor(counts);
      return {
        username: row.username,
        displayName: row.display_name,
        avatarUrl: row.avatar_url,
        skills: skillsOf(row.skills),
        xp,
        tier: tierFor(xp).tier.name,
        counts,
        joined: row.created_at,
      };
    })
    .sort((a, b) => b.xp - a.xp || a.joined.localeCompare(b.joined))
    .slice(0, limit)
    .map(({ joined: _joined, ...rest }, index) => ({ ...rest, rank: index + 1 }));
}

export async function loadGuildStats(sql: Sql): Promise<GuildStats> {
  const rows = await sql<{ passports: unknown; open_opportunities: unknown; accepted_work: unknown }>`
    select
      (select count(*) from contributor_profiles where visibility = 'public') as passports,
      (select count(*) from opportunities where status = 'open' and is_demo = false) as open_opportunities,
      (select count(*) from work_submissions where status = 'accepted') as accepted_work
  `;
  const row = rows[0];
  return {
    passports: Number(row?.passports ?? 0),
    openOpportunities: Number(row?.open_opportunities ?? 0),
    acceptedWork: Number(row?.accepted_work ?? 0),
  };
}
