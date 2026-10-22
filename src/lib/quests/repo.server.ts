import type { Sql } from "@/lib/db";
import { QUESTS, questXp, seasonFor, streakFrom, utcDay, type QuestId } from "./quests";

export type QuestBoard = {
  day: string;
  streak: number;
  done: QuestId[];
  todayXp: number;
  /** Set when another Chog in the same wallet already did a quest today. */
  blockedBy: Partial<Record<QuestId, number>>;
};

export async function questBoard(sql: Sql, chogId: number, wallet: string, now = Date.now()): Promise<QuestBoard> {
  const day = utcDay(now);
  const rows = await sql<{ day: string; quest: QuestId; xp: number }>`
    select to_char(day, 'YYYY-MM-DD') as day, quest, xp from chog_quests
    where chog_id = ${chogId} and day >= (${day}::date - 60) order by day desc
  `;
  const others = await sql<{ quest: QuestId; chog_id: number }>`
    select quest, chog_id from chog_quests where wallet = ${wallet} and day = ${day}::date and chog_id <> ${chogId}
  `;
  const today = rows.filter((r) => r.day === day);
  return {
    day,
    streak: streakFrom(rows.filter((r) => r.quest === "checkin").map((r) => r.day), now),
    done: today.map((r) => r.quest),
    todayXp: today.reduce((t, r) => t + Number(r.xp), 0),
    blockedBy: Object.fromEntries(others.map((o) => [o.quest, Number(o.chog_id)])),
  };
}

export async function completeQuest(
  sql: Sql,
  chogId: number,
  wallet: string,
  quest: QuestId,
  now = Date.now(),
): Promise<{ ok: true; xp: number; board: QuestBoard } | { ok: false; error: string }> {
  const before = await questBoard(sql, chogId, wallet, now);
  if (before.done.includes(quest)) return { ok: false, error: "Already done today. Come back tomorrow." };
  if (before.blockedBy[quest]) {
    return { ok: false, error: `Chog #${before.blockedBy[quest]} from this wallet already did this quest today. One Chog per wallet per quest per day.` };
  }
  const streak = quest === "checkin" ? before.streak + (before.done.includes("checkin") ? 0 : 1) : before.streak;
  const xp = questXp(quest, streak);
  try {
    await sql`insert into chog_quests (chog_id, wallet, day, quest, xp) values (${chogId}, ${wallet}, ${before.day}::date, ${quest}, ${xp})`;
  } catch {
    return { ok: false, error: "Already done today. Come back tomorrow." };
  }
  return { ok: true, xp, board: await questBoard(sql, chogId, wallet, now) };
}

/** Lifetime and current-season quest XP per Chog. */
export async function questTotals(sql: Sql, now = Date.now()): Promise<Map<number, { total: number; season: number; streak: number }>> {
  const { start } = seasonFor(now);
  const seasonDay = utcDay(start);
  const rows = await sql<{ chog_id: number; total: unknown; season: unknown; days: unknown }>`
    select chog_id, sum(xp) as total,
      sum(case when day >= ${seasonDay}::date then xp else 0 end) as season,
      coalesce(json_agg(to_char(day, 'YYYY-MM-DD')) filter (where quest = 'checkin'), '[]') as days
    from chog_quests group by chog_id
  `;
  const out = new Map<number, { total: number; season: number; streak: number }>();
  for (const r of rows) {
    const days = (typeof r.days === "string" ? JSON.parse(r.days) : r.days) as string[];
    out.set(Number(r.chog_id), { total: Number(r.total), season: Number(r.season), streak: streakFrom(days, now) });
  }
  // Duel XP (already diminished and capped per season at insert time) counts with quest XP.
  const { duelTotals } = await import("@/lib/duels/repo.server");
  for (const [id, d] of await duelTotals(sql, now)) {
    const q = out.get(id) ?? { total: 0, season: 0, streak: 0 };
    out.set(id, { total: q.total + d.total, season: q.season + d.season, streak: q.streak });
  }
  return out;
}

export { QUESTS };
