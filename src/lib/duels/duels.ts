/**
 * Chog-vs-Chog duels: three rounds of charge / guard / trick.
 * Charge beats trick, trick beats guard, guard beats charge. A tied round goes to the higher-tier Chog.
 * The defender auto-plays: each round it throws its signature move about half the time, otherwise a
 * random move. Knowing a rival's signature is the skill element; the random half keeps it honest.
 * Pure helpers shared by server, UI and tests.
 */

export const MOVES = [
  { id: "charge", label: "Charge", beats: "trick" },
  { id: "guard", label: "Guard", beats: "charge" },
  { id: "trick", label: "Trick", beats: "guard" },
] as const;
export type MoveId = (typeof MOVES)[number]["id"];
export const MOVE_IDS = MOVES.map((m) => m.id) as MoveId[];
const CODE: Record<MoveId, string> = { charge: "C", guard: "G", trick: "T" };
const FROM_CODE: Record<string, MoveId> = { C: "charge", G: "guard", T: "trick" };

export const ROUNDS = 3;
/** Duels a wallet can start per UTC day, across all its Chogs. */
export const DAILY_DUELS = 5;
/** Duel XP a Chog can earn per season (challenging and defending combined). */
export const SEASON_DUEL_CAP = 60;
/** Same pair (either direction) earns XP for at most this many duels per season, halving each time. */
export const PAIR_XP_DUELS = 3;
export const BASE_XP = { win: 6, draw: 3, loss: 1 } as const;
export const DEFENDER_WIN_XP = 3;

export type Outcome = "win" | "loss" | "draw";
export type Round = { c: MoveId; d: MoveId; winner: "c" | "d" | "tie"; edge: boolean };

export function isMove(value: unknown): value is MoveId {
  return typeof value === "string" && (MOVE_IDS as string[]).includes(value);
}

export function signatureMove(chogId: number): MoveId {
  return MOVE_IDS[(chogId * 7 + 1) % 3];
}

export function encodePicks(picks: MoveId[]): string {
  return picks.map((p) => CODE[p]).join("");
}

export function decodePicks(code: string): MoveId[] {
  return [...code].map((c) => FROM_CODE[c]).filter(Boolean);
}

/** `rand` returns [0, 1). Server passes a crypto-backed source after the challenger has committed. */
export function defenderPicks(chogId: number, rand: () => number): MoveId[] {
  const sig = signatureMove(chogId);
  return Array.from({ length: ROUNDS }, () => (rand() < 0.5 ? sig : MOVE_IDS[Math.min(2, Math.floor(rand() * 3))]));
}

export function resolveDuel(c: MoveId[], d: MoveId[], cLevel: number, dLevel: number) {
  const rounds: Round[] = c.map((cm, i) => {
    const dm = d[i];
    const beats = (a: MoveId, b: MoveId) => MOVES.find((m) => m.id === a)!.beats === b;
    if (beats(cm, dm)) return { c: cm, d: dm, winner: "c" as const, edge: false };
    if (beats(dm, cm)) return { c: cm, d: dm, winner: "d" as const, edge: false };
    if (cLevel === dLevel) return { c: cm, d: dm, winner: "tie" as const, edge: false };
    return { c: cm, d: dm, winner: cLevel > dLevel ? ("c" as const) : ("d" as const), edge: true };
  });
  const cs = rounds.filter((r) => r.winner === "c").length;
  const ds = rounds.filter((r) => r.winner === "d").length;
  const outcome: Outcome = cs > ds ? "win" : cs < ds ? "loss" : "draw";
  return { rounds, challengerScore: cs, defenderScore: ds, outcome };
}

/** XP after diminishing returns for the pair and the season cap. `pairDuels` = earlier duels of this pair this season. */
export function duelXp(base: number, pairDuels: number, seasonSoFar: number): number {
  if (pairDuels >= PAIR_XP_DUELS) return 0;
  const xp = Math.floor(base / 2 ** pairDuels);
  return Math.max(0, Math.min(xp, SEASON_DUEL_CAP - seasonSoFar));
}

export function duelRewards(outcome: Outcome, pairDuels: number, challengerSeason: number, defenderSeason: number) {
  return {
    challengerXp: duelXp(BASE_XP[outcome], pairDuels, challengerSeason),
    defenderXp: outcome === "loss" ? duelXp(DEFENDER_WIN_XP, pairDuels, defenderSeason) : 0,
  };
}
