import { randomBytes, randomInt } from "node:crypto";
import type { Sql } from "@/lib/db";
import { seasonFor, utcDay } from "@/lib/quests/quests";
import { DAILY_DUELS, decodePicks, defenderPicks, duelRewards, encodePicks, resolveDuel, type MoveId, type Outcome } from "./duels";

export type DuelRow = {
  id: string;
  challengerId: number;
  defenderId: number;
  challengerPicks: MoveId[];
  defenderPicks: MoveId[];
  challengerLevel: number;
  defenderLevel: number;
  challengerScore: number;
  defenderScore: number;
  outcome: Outcome;
  challengerXp: number;
  defenderXp: number;
  createdAt: string;
};

type Raw = {
  id: string; challenger_id: number; defender_id: number; challenger_picks: string; defender_picks: string;
  challenger_level: number; defender_level: number; challenger_score: number; defender_score: number;
  outcome: Outcome; challenger_xp: number; defender_xp: number; created_at: string;
};

function toRow(r: Raw): DuelRow {
  return {
    id: r.id,
    challengerId: Number(r.challenger_id),
    defenderId: Number(r.defender_id),
    challengerPicks: decodePicks(r.challenger_picks),
    defenderPicks: decodePicks(r.defender_picks),
    challengerLevel: Number(r.challenger_level),
    defenderLevel: Number(r.defender_level),
    challengerScore: Number(r.challenger_score),
    defenderScore: Number(r.defender_score),
    outcome: r.outcome,
    challengerXp: Number(r.challenger_xp),
    defenderXp: Number(r.defender_xp),
    createdAt: r.created_at,
  };
}

const COLS = `id, challenger_id, defender_id, challenger_picks, defender_picks, challenger_level, defender_level,
  challenger_score, defender_score, outcome, challenger_xp, defender_xp,
  to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at`;

export async function getDuel(sql: Sql, id: string): Promise<DuelRow | null> {
  const rows = await sql.query<Raw>(`select ${COLS} from chog_duels where id = $1`, [id]);
  return rows[0] ? toRow(rows[0]) : null;
}

export async function duelHistory(sql: Sql, chogId: number, limit = 10): Promise<DuelRow[]> {
  const rows = await sql.query<Raw>(
    `select ${COLS} from chog_duels where challenger_id = $1 or defender_id = $1 order by created_at desc limit $2`,
    [chogId, limit],
  );
  return rows.map(toRow);
}

export async function duelsLeftToday(sql: Sql, wallet: string, now = Date.now()): Promise<number> {
  const rows = await sql<{ n: unknown }>`select count(*) as n from chog_duels where challenger_wallet = ${wallet} and day = ${utcDay(now)}::date`;
  return Math.max(0, DAILY_DUELS - Number(rows[0]?.n ?? 0));
}

async function seasonDuelXp(sql: Sql, chogId: number, since: string): Promise<number> {
  const rows = await sql<{ xp: unknown }>`
    select coalesce(sum(case when challenger_id = ${chogId} then challenger_xp else defender_xp end), 0) as xp
    from chog_duels where (challenger_id = ${chogId} or defender_id = ${chogId}) and created_at >= ${since}::timestamptz`;
  return Number(rows[0]?.xp ?? 0);
}

export async function createDuel(
  sql: Sql,
  input: { challengerId: number; defenderId: number; wallet: string; defenderWallet: string; picks: MoveId[]; challengerLevel: number; defenderLevel: number },
  now = Date.now(),
): Promise<{ ok: true; duel: DuelRow } | { ok: false; error: string }> {
  if (input.wallet === input.defenderWallet) return { ok: false, error: "Both Chogs are in your wallet. Duel a real rival." };
  if ((await duelsLeftToday(sql, input.wallet, now)) <= 0) return { ok: false, error: `That's ${DAILY_DUELS} duels from this wallet today. Back tomorrow (UTC).` };
  const since = new Date(seasonFor(now).start).toISOString();
  const pair = await sql<{ n: unknown }>`
    select count(*) as n from chog_duels where created_at >= ${since}::timestamptz and
      ((challenger_id = ${input.challengerId} and defender_id = ${input.defenderId}) or (challenger_id = ${input.defenderId} and defender_id = ${input.challengerId}))`;
  const [cSeason, dSeason] = await Promise.all([seasonDuelXp(sql, input.challengerId, since), seasonDuelXp(sql, input.defenderId, since)]);
  const dPicks = defenderPicks(input.defenderId, () => randomInt(0, 1_000_000) / 1_000_000);
  const result = resolveDuel(input.picks, dPicks, input.challengerLevel, input.defenderLevel);
  const xp = duelRewards(result.outcome, Number(pair[0]?.n ?? 0), cSeason, dSeason);
  const id = randomBytes(8).toString("hex");
  await sql`
    insert into chog_duels (id, challenger_id, defender_id, challenger_wallet, defender_wallet, day, challenger_picks, defender_picks,
      challenger_level, defender_level, challenger_score, defender_score, outcome, challenger_xp, defender_xp)
    values (${id}, ${input.challengerId}, ${input.defenderId}, ${input.wallet}, ${input.defenderWallet}, ${utcDay(now)}::date,
      ${encodePicks(input.picks)}, ${encodePicks(dPicks)}, ${input.challengerLevel}, ${input.defenderLevel},
      ${result.challengerScore}, ${result.defenderScore}, ${result.outcome}, ${xp.challengerXp}, ${xp.defenderXp})`;
  const duel = await getDuel(sql, id);
  return duel ? { ok: true, duel } : { ok: false, error: "The duel couldn't be saved." };
}

/** Lifetime and season duel XP per Chog (challenging + defending). */
export async function duelTotals(sql: Sql, now = Date.now()): Promise<Map<number, { total: number; season: number }>> {
  const since = new Date(seasonFor(now).start).toISOString();
  const rows = await sql<{ chog_id: number; total: unknown; season: unknown }>`
    select chog_id, sum(xp) as total, sum(case when created_at >= ${since}::timestamptz then xp else 0 end) as season from (
      select challenger_id as chog_id, challenger_xp as xp, created_at from chog_duels
      union all select defender_id as chog_id, defender_xp as xp, created_at from chog_duels
    ) t group by chog_id`;
  return new Map(rows.map((r) => [Number(r.chog_id), { total: Number(r.total), season: Number(r.season) }]));
}
