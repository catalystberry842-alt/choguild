import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import * as S from "@/lib/schemas";
import type { Contributor } from "./xp";

export async function loadRanking(): Promise<{
  contributors: Contributor[];
  stats: { passports: number; openOpportunities: number; acceptedWork: number; questsToday: number };
  season: { number: number; start: number; end: number };
  /** Season prize text, only when configured (SEASON_PRIZE). Default none: no prize is promised. */
  prize: string | null;
}> {
  const { getSql } = await import("@/lib/db");
  const { listContributors, loadGuildStats } = await import("./repo.server");
  const { chogSnapshot } = await import("@/lib/chog/holders.server");
  const { seasonFor } = await import("@/lib/quests/quests");
  const sql = await getSql();
  // Snapshot of current owners (cached; never blocks long) for the same-wallet self-dealing rule.
  const snap = await chogSnapshot({ budgetMs: 1_500 }).catch(() => null);
  const byToken = new Map<number, string>();
  if (snap) for (const [owner, ids] of snap.owners) for (const id of ids) byToken.set(id, owner);
  const [contributors, stats] = await Promise.all([
    listContributors(sql, { holderOf: (id) => byToken.get(id) ?? null }),
    loadGuildStats(sql),
  ]);
  return { contributors, stats, season: seasonFor(), prize: process.env.SEASON_PRIZE?.trim().slice(0, 200) || null };
}

export const getRanking = createServerFn({ method: "GET" }).handler(async () => loadRanking());

export type ChogRecord = Awaited<ReturnType<typeof loadChogRecord>>;

async function loadChogRecord(chogId: number) {
  const { getSql } = await import("@/lib/db");
  const { liveOwnerOf } = await import("@/lib/chog/actor.server");
  const { findProfileForWallet } = await import("@/lib/passport/repo.server");
  const { publicContributions } = await import("@/lib/work/repo.server");
  const { rankContributors, tierFor, totalXp } = await import("./xp");
  const sql = await getSql();
  const [owner, profile, ranking] = await Promise.all([
    liveOwnerOf(chogId).catch(() => undefined),
    findProfileForWallet(sql, `chog:${chogId}`),
    loadRanking(),
  ]);
  const all = rankContributors(ranking.contributors, "overall", Math.max(ranking.contributors.length, 1));
  const season = rankContributors(ranking.contributors, "season", Math.max(ranking.contributors.length, 1));
  const person = all.find((row) => row.chogId === chogId) ?? null;
  const work = profile ? await publicContributions(sql, profile.username).catch(() => null) : null;
  const xp = person ? totalXp(person) : 0;
  const { tier, next, progress } = tierFor(xp);
  return {
    chogId,
    /** Live ownerOf; null = unminted/burned, undefined = RPC unreachable. */
    owner: owner === undefined ? null : owner,
    ownerKnown: owner !== undefined,
    profile,
    standing: person
      ? {
          rank: person.rank,
          of: all.length,
          seasonRank: season.find((row) => row.chogId === chogId)?.rank ?? null,
          xp,
          guildXp: person.guildXp,
          questXp: person.questXp,
          seasonXp: person.seasonXp,
          streak: person.streak,
          counts: person.counts,
        }
      : null,
    tier: tier.name,
    nextTier: next?.name ?? null,
    nextAt: next?.min ?? null,
    progress,
    work,
    season: ranking.season,
  };
}

export const getChogRecord = createServerFn({ method: "GET" })
  .validator((id: unknown) => S.parseInput(z.coerce.number().int().min(1).max(10_000), id))
  .handler(async ({ data }) => loadChogRecord(data));
