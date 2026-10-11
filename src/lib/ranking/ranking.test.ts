import assert from "node:assert/strict";
import { test } from "node:test";
import { onchainXpFor, rankContributors, tierFor, xpFor, type Contributor } from "./xp.ts";

test("xp adds every rule", () => {
  assert.equal(xpFor({ acceptedSubmissions: 2, acceptedApplications: 1, publishedOpportunities: 1, passport: 1 }), 250);
});

test("tiers step at their thresholds", () => {
  assert.equal(tierFor(0).tier.name, "Hatchling");
  assert.equal(tierFor(49).tier.name, "Hatchling");
  assert.equal(tierFor(50).tier.name, "Apprentice");
  assert.equal(tierFor(1000).tier.name, "Legend");
  assert.equal(tierFor(1000).next, null);
  assert.equal(tierFor(100).progress, 0.5);
});

test("onchain xp grows with the square root and caps", () => {
  assert.equal(onchainXpFor(0), 0);
  assert.equal(onchainXpFor(1), 10);
  assert.equal(onchainXpFor(25), 50);
  assert.equal(onchainXpFor(100_000), 150);
  assert.equal(onchainXpFor(Number.NaN), 0);
});

function person(username: string, guildXp: number, onchainXp: number | null, joined = "2026-01-01"): Contributor {
  return {
    username,
    displayName: username,
    avatarUrl: null,
    wallet: "0x" + username,
    joined,
    counts: { acceptedSubmissions: 0, acceptedApplications: 0, publishedOpportunities: 0, passport: 1 },
    guildXp,
    txCount: onchainXp === null ? null : 1,
    onchainXp,
  };
}

test("rank modes sort by their own score and keep overall tiers", () => {
  const people = [person("builder", 260, 20), person("trader", 10, 150), person("lurker", 10, null)];
  const order = (by: "overall" | "guild" | "onchain") => rankContributors(people, by).map((p) => p.username);
  assert.deepEqual(order("overall"), ["builder", "trader", "lurker"]);
  assert.deepEqual(order("guild"), ["builder", "trader", "lurker"]);
  assert.deepEqual(order("onchain"), ["trader", "builder", "lurker"]);
  const onchain = rankContributors(people, "onchain");
  assert.equal(onchain[0].xp, 150);
  assert.equal(onchain[0].tier, "Artisan");
  assert.equal(onchain[2].xp, 0);
});

test("ties fall back to overall xp, then join date", () => {
  const people = [person("late", 10, 0, "2026-05-01"), person("early", 10, 0, "2026-01-01"), person("busy", 10, 0)];
  people[2].guildXp = 10;
  assert.deepEqual(rankContributors(people, "guild").map((p) => p.username), ["early", "busy", "late"]);
});
