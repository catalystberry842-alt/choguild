import assert from "node:assert/strict";
import { test } from "node:test";
import { computeGuildXp, LISTING_MIN_OPEN_MS, PERIOD_XP_CAP, type ListingEvent, type WorkEvent } from "./farming.ts";

const A = "0xaaaa";
const B = "0xbbbb";
const C = "0xcccc";
const NOW = Date.parse("2026-10-16T12:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString().replace(/\.\d{3}Z$/, "Z");

test("publish+close loops earn nothing", () => {
  const listings: ListingEvent[] = Array.from({ length: 66 }, (_, i) => ({
    id: `l${i}`,
    owner: A,
    publishedAt: iso(NOW - 10 * 86_400_000 + i * 60_000),
    closedAt: iso(NOW - 10 * 86_400_000 + i * 60_000 + 30_000),
  }));
  const xp = computeGuildXp([A], [], listings, NOW).get(A)!;
  assert.equal(xp.xp, 10); // passport only
  assert.equal(xp.counts.publishedOpportunities, 0);
});

test("listings open 3 days count, capped per month", () => {
  const listings: ListingEvent[] = Array.from({ length: 10 }, (_, i) => ({
    id: `l${i}`,
    owner: A,
    publishedAt: iso(NOW - LISTING_MIN_OPEN_MS - 86_400_000 - i * 1000),
    closedAt: null,
  }));
  const xp = computeGuildXp([A], [], listings, NOW).get(A)!;
  assert.equal(xp.counts.publishedOpportunities, 4);
  assert.equal(xp.xp, 10 + 4 * 15);
});

function round(contributor: string, owner: string, i: number): WorkEvent[] {
  const at = iso(NOW - 86_400_000 + i * 60_000);
  return [
    { kind: "application", contributor, owner, opportunityId: `${owner}-o${i}`, at },
    { kind: "submission", contributor, owner, opportunityId: `${owner}-o${i}`, at },
  ];
}

test("two wallets trading accepted work hit diminishing then zero returns", () => {
  const work: WorkEvent[] = [];
  for (let i = 0; i < 50; i += 1) work.push(...round(A, B, i * 2), ...round(B, A, i * 2 + 1));
  const listings: ListingEvent[] = Array.from({ length: 100 }, (_, i) => ({
    id: `${i % 2 ? A : B}-o${i}`,
    owner: i % 2 ? A : B,
    publishedAt: iso(NOW - 86_400_000),
    closedAt: iso(NOW - 86_400_000 + 1000),
  }));
  const result = computeGuildXp([A, B], work, listings, NOW);
  // Pair shares one counter: job 1 (A) full = 125, job 2 (B) half = 63; plus one credited listing each.
  assert.equal(result.get(A)!.xp, 10 + 125 + 15);
  assert.equal(result.get(B)!.xp, 10 + 63 + 15);
});

test("self-dealing earns nothing", () => {
  const xp = computeGuildXp([A], round(A, A, 0), [], NOW).get(A)!;
  assert.equal(xp.xp, 10);
});

test("real work with many different publishers is capped per 30-day period", () => {
  const owners = Array.from({ length: 10 }, (_, i) => `0xowner${i}`);
  const work = owners.flatMap((owner, i) => round(C, owner, i));
  const xp = computeGuildXp([C], work, [], NOW).get(C)!;
  assert.equal(xp.xp, 10 + PERIOD_XP_CAP);
});

test("honest history across periods keeps full credit", () => {
  const work = Array.from({ length: 3 }, (_, i): WorkEvent => ({
    kind: "submission",
    contributor: C,
    owner: `0xo${i}`,
    opportunityId: `o${i}`,
    at: iso(NOW - i * 40 * 86_400_000),
  }));
  assert.equal(computeGuildXp([C], work, [], NOW).get(C)!.xp, 310);
});
