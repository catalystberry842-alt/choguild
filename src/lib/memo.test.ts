import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { memo, resetMemo } from "./memo.server.ts";

beforeEach(() => resetMemo());

test("serves a fresh value without reloading", async () => {
  let calls = 0;
  const load = async () => ++calls;
  assert.equal(await memo("k", 1_000, load, 0), 1);
  assert.equal(await memo("k", 1_000, load, 500), 1);
  assert.equal(calls, 1);
});

test("serves the stale value while one refresh runs", async () => {
  let calls = 0;
  const load = async () => ++calls;
  await memo("k", 10, load, 0);
  const stale = await memo("k", 10, load, Date.now() + 1_000);
  assert.equal(stale, 1);
  await new Promise((resolve) => setTimeout(resolve, 5));
  assert.equal(await memo("k", 60_000, load), 2);
});

test("a first load that fails is not cached", async () => {
  await assert.rejects(memo("k", 1_000, async () => { throw new Error("down"); }));
  assert.equal(await memo("k", 1_000, async () => 7), 7);
});
