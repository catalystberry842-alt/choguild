import assert from "node:assert/strict";
import { test } from "node:test";
import { tierFor, xpFor } from "./xp.ts";

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
