import assert from "node:assert/strict";
import { test } from "node:test";
import { decodePicks, defenderPicks, duelRewards, duelXp, encodePicks, isMove, resolveDuel, SEASON_DUEL_CAP, signatureMove } from "./duels.ts";

test("rock-paper-scissors rounds, tie goes to higher tier", () => {
  const r = resolveDuel(["charge", "guard", "trick"], ["trick", "trick", "trick"], 0, 0);
  assert.deepEqual(r.rounds.map((x) => x.winner), ["c", "d", "tie"]);
  assert.equal(r.outcome, "draw");
  const edge = resolveDuel(["charge", "guard", "trick"], ["trick", "trick", "trick"], 2, 1);
  assert.equal(edge.outcome, "win");
  assert.ok(edge.rounds[2].edge);
  assert.equal(resolveDuel(["guard", "guard", "guard"], ["trick", "trick", "trick"], 4, 0).outcome, "loss");
});

test("defender plays its signature about half the time", () => {
  let seed = 1;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const sig = signatureMove(12);
  let hits = 0;
  for (let i = 0; i < 400; i += 1) hits += defenderPicks(12, rand).filter((m) => m === sig).length;
  const share = hits / 1200;
  assert.ok(share > 0.55 && share < 0.78, `signature share ${share}`);
});

test("picks encode round-trip", () => {
  assert.equal(encodePicks(["charge", "guard", "trick"]), "CGT");
  assert.deepEqual(decodePicks("TGC"), ["trick", "guard", "charge"]);
  assert.ok(isMove("guard") && !isMove("nuke"));
});

test("pair diminishing returns and season cap", () => {
  assert.equal(duelXp(6, 0, 0), 6);
  assert.equal(duelXp(6, 1, 0), 3);
  assert.equal(duelXp(6, 2, 0), 1);
  assert.equal(duelXp(6, 3, 0), 0);
  assert.equal(duelXp(6, 0, SEASON_DUEL_CAP - 2), 2);
  assert.equal(duelXp(6, 0, SEASON_DUEL_CAP), 0);
  assert.deepEqual(duelRewards("loss", 0, 0, 0), { challengerXp: 1, defenderXp: 3 });
  assert.deepEqual(duelRewards("win", 0, 0, 0), { challengerXp: 6, defenderXp: 0 });
});

test("server duels: daily wallet limit, same-wallet block, pair diminishing XP, totals feed the season", async () => {
  const { freshDb } = await import("../testing/pg.ts");
  const { createDuel, duelTotals, duelsLeftToday, duelHistory } = await import("./repo.server.ts");
  const { DAILY_DUELS } = await import("./duels.ts");
  const { sql } = await freshDb();
  const now = Date.parse("2026-10-22T12:00:00Z");
  const base = { challengerId: 1, defenderId: 2, wallet: "0xaaa", defenderWallet: "0xbbb", picks: ["charge", "guard", "trick"] as const, challengerLevel: 4, defenderLevel: 0 };
  const same = await createDuel(sql as never, { ...base, picks: [...base.picks], defenderWallet: "0xaaa" }, now);
  assert.equal(same.ok, false);
  const xps: number[] = [];
  for (let i = 0; i < 4; i += 1) {
    const r = await createDuel(sql as never, { ...base, picks: [...base.picks] }, now);
    assert.ok(r.ok);
    if (r.ok) xps.push(r.duel.challengerXp);
  }
  // level 4 vs 0 never loses a round outright on ties; XP halves per repeat and stops after 3
  assert.equal(xps[3], 0);
  assert.ok(xps[0] >= xps[1] && xps[1] >= xps[2]);
  assert.equal(await duelsLeftToday(sql as never, "0xaaa", now), DAILY_DUELS - 4);
  await createDuel(sql as never, { ...base, picks: [...base.picks], defenderId: 3, defenderWallet: "0xccc" }, now);
  const over = await createDuel(sql as never, { ...base, picks: [...base.picks], defenderId: 4, defenderWallet: "0xddd" }, now);
  assert.equal(over.ok, false);
  const totals = await duelTotals(sql as never, now);
  assert.equal(totals.get(1)!.season, totals.get(1)!.total);
  assert.equal((await duelHistory(sql as never, 1)).length, DAILY_DUELS);
});
