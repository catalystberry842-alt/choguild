/** Daily Chog quests, streaks and weekly seasons. Pure helpers shared by server, UI and tests. */

export const QUESTS = [
  { id: "checkin", label: "Check in", detail: "Show up for the guild today.", xp: 5 },
  { id: "scout", label: "Scout a listing", detail: "Open any open listing on the board.", xp: 5 },
  { id: "rival", label: "Size up a rival", detail: "Visit another Chog's record.", xp: 5 },
] as const;

export type QuestId = (typeof QUESTS)[number]["id"];
export const QUEST_IDS = QUESTS.map((q) => q.id) as QuestId[];
/** Check-in streak bonus: +1 XP per consecutive day, capped. */
export const STREAK_BONUS_CAP = 10;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const WEEK_MS = 7 * DAY_MS;
/** Season 1 starts Monday 19 Oct 2026 00:00 UTC; each season is one UTC week. */
export const SEASON_EPOCH = Date.UTC(2026, 9, 19);

export function isQuestId(value: unknown): value is QuestId {
  return typeof value === "string" && (QUEST_IDS as string[]).includes(value);
}

export function utcDay(ms = Date.now()): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function questXp(quest: QuestId, streak: number): number {
  const base = QUESTS.find((q) => q.id === quest)!.xp;
  return quest === "checkin" ? base + Math.min(STREAK_BONUS_CAP, Math.max(0, streak - 1)) : base;
}

/** Consecutive check-in days ending today (or yesterday, if today isn't checked in yet). */
export function streakFrom(checkinDays: string[], now = Date.now()): number {
  const set = new Set(checkinDays);
  let cursor = Date.parse(`${utcDay(now)}T00:00:00Z`);
  if (!set.has(utcDay(cursor))) cursor -= DAY_MS;
  let streak = 0;
  while (set.has(utcDay(cursor))) {
    streak += 1;
    cursor -= DAY_MS;
  }
  return streak;
}

export function seasonFor(now = Date.now()): { number: number; start: number; end: number } {
  const n = Math.max(0, Math.floor((now - SEASON_EPOCH) / WEEK_MS));
  const start = SEASON_EPOCH + n * WEEK_MS;
  return { number: n + 1, start, end: start + WEEK_MS };
}
