import assert from "node:assert/strict";
import { test } from "node:test";
import { isQuestId, questXp, seasonFor, streakFrom, STREAK_BONUS_CAP } from "./quests.ts";
import { actorKey, chogIdOf, isChogActor } from "../chog/actor.ts";

const now = Date.parse("2026-10-22T13:00:00Z");

test("streak counts consecutive check-in days ending today or yesterday", () => {
  assert.equal(streakFrom([], now), 0);
  assert.equal(streakFrom(["2026-10-22", "2026-10-21", "2026-10-20"], now), 3);
  assert.equal(streakFrom(["2026-10-21", "2026-10-20"], now), 2);
  assert.equal(streakFrom(["2026-10-22", "2026-10-20"], now), 1);
  assert.equal(streakFrom(["2026-10-19"], now), 0);
});

test("check-in xp grows with the streak and caps", () => {
  assert.equal(questXp("checkin", 1), 5);
  assert.equal(questXp("checkin", 4), 8);
  assert.equal(questXp("checkin", 100), 5 + STREAK_BONUS_CAP);
  assert.equal(questXp("scout", 50), 5);
  assert.ok(isQuestId("rival"));
  assert.ok(!isQuestId("spam"));
});

test("seasons are UTC weeks from Monday 19 Oct 2026", () => {
  assert.deepEqual(seasonFor(Date.UTC(2026, 9, 19)), { number: 1, start: Date.UTC(2026, 9, 19), end: Date.UTC(2026, 9, 26) });
  assert.equal(seasonFor(now).number, 1);
  assert.equal(seasonFor(Date.UTC(2026, 9, 26, 0, 0, 1)).number, 2);
});

test("actor keys round-trip and reject non-Chogs", () => {
  assert.equal(actorKey(42), "chog:42");
  assert.equal(chogIdOf("chog:42"), 42);
  assert.equal(chogIdOf("chog:0"), null);
  assert.equal(chogIdOf("chog:99999"), null);
  assert.equal(chogIdOf("0xabc"), null);
  assert.ok(isChogActor("chog:1969"));
});
