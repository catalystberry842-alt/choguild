import assert from "node:assert/strict";
import { test } from "node:test";
import { rankContributors, tierFor, totalXp, xpFor, type Contributor } from "./xp.ts";
import { computeGuildXp } from "./farming.ts";

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

function chog(id: number, guildXp: number, questXp: number, seasonXp: number, joined = "2026-01-01"): Contributor {
  return {
    chogId: id,
    username: `c${id}`,
    displayName: `Chog ${id}`,
    avatarUrl: null,
    wallet: `chog:${id}`,
    joined,
    counts: { acceptedSubmissions: 0, acceptedApplications: 0, publishedOpportunities: 0, passport: 1 },
    guildXp,
    questXp,
    seasonXp,
    streak: 0,
  };
}

test("leaderboard ranks Chogs all-time (work + quests) and by season", () => {
  const people = [chog(1, 260, 0, 0), chog(2, 10, 300, 40), chog(3, 10, 5, 15)];
  assert.deepEqual(rankContributors(people, "overall").map((p) => p.chogId), [2, 1, 3]);
  assert.deepEqual(rankContributors(people, "season").map((p) => p.chogId), [2, 3, 1]);
  const season = rankContributors(people, "season");
  assert.equal(season[0].xp, 40);
  assert.equal(season[0].tier, tierFor(totalXp(people[1])).tier.name);
});

test("ties fall back to all-time xp, then join date", () => {
  const people = [chog(5, 10, 0, 0, "2026-05-01"), chog(6, 10, 0, 0, "2026-01-01")];
  assert.deepEqual(rankContributors(people, "overall").map((p) => p.chogId), [6, 5]);
});

test("Chogs held by the same wallet earn nothing from each other", () => {
  const at = "2026-10-20T10:00:00Z";
  const work = [{ kind: "submission" as const, contributor: "chog:1", owner: "chog:2", opportunityId: "o1", at }];
  const holder = (a: string) => (a === "chog:1" || a === "chog:2" ? "0xsame" : a);
  const same = computeGuildXp(["chog:1", "chog:2"], work, [], Date.parse(at), { sameHolder: (a, b) => holder(a) === holder(b) });
  assert.equal(same.get("chog:1")!.xp, 10);
  const apart = computeGuildXp(["chog:1", "chog:2"], work, [], Date.parse(at));
  assert.equal(apart.get("chog:1")!.xp, 110);
});

test("season xp counts only events since the season start", () => {
  const work = [
    { kind: "submission" as const, contributor: "chog:1", owner: "chog:9", opportunityId: "old", at: "2026-10-01T10:00:00Z" },
    { kind: "application" as const, contributor: "chog:1", owner: "chog:8", opportunityId: "new", at: "2026-10-20T10:00:00Z" },
  ];
  const r = computeGuildXp(["chog:1"], work, [], Date.parse("2026-10-22T00:00:00Z"), { seasonStart: Date.UTC(2026, 9, 19) });
  assert.equal(r.get("chog:1")!.seasonXp, 25);
  assert.equal(r.get("chog:1")!.xp, 135);
});
