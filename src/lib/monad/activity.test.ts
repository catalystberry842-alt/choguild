import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { loadTxCounts, resetActivityCache } from "./activity.server.ts";

const A = "0x00000000000000000000000000000000000000AA";
const B = "0x00000000000000000000000000000000000000bb";
const C = "0x00000000000000000000000000000000000000cc";

function rpc(handler: (calls: { id: number; params: string[] }[]) => unknown, log: string[] = []) {
  return (async (url: string, init: RequestInit) => {
    log.push(url);
    const calls = JSON.parse(String(init.body));
    return new Response(JSON.stringify(handler(calls)), { status: 200 });
  }) as unknown as typeof fetch;
}

beforeEach(() => resetActivityCache());

test("reads nonces from a batched reply, lowercasing addresses", async () => {
  const fetcher = rpc((calls) => calls.map((c) => ({ jsonrpc: "2.0", id: c.id, result: c.params[0].endsWith("aa") ? "0x19" : "0x0" })));
  const counts = await loadTxCounts([A, B], { fetcher, rpcUrls: ["https://one"] });
  assert.equal(counts.get(A.toLowerCase()), 25);
  assert.equal(counts.get(B), 0);
});

test("falls back to the next RPC when one fails", async () => {
  const log: string[] = [];
  let first = true;
  const fetcher = (async (url: string, init: RequestInit) => {
    log.push(url);
    if (first) {
      first = false;
      return new Response("nope", { status: 503 });
    }
    const calls = JSON.parse(String(init.body));
    return new Response(JSON.stringify(calls.map((c: { id: number }) => ({ id: c.id, result: "0x2" }))));
  }) as unknown as typeof fetch;
  const counts = await loadTxCounts([A], { fetcher, rpcUrls: ["https://one", "https://two"] });
  assert.deepEqual(log, ["https://one", "https://two"]);
  assert.equal(counts.get(A.toLowerCase()), 2);
});

test("skips error entries and returns empty when every RPC fails", async () => {
  const partial = rpc((calls) => calls.map((c) => (c.id === 0 ? { id: 0, error: { code: -1 } } : { id: c.id, result: "0x5" })));
  const counts = await loadTxCounts([A, B], { fetcher: partial, rpcUrls: ["https://one"] });
  assert.equal(counts.has(A.toLowerCase()), false);
  assert.equal(counts.get(B), 5);

  resetActivityCache();
  const down = (async () => { throw new Error("offline"); }) as unknown as typeof fetch;
  assert.equal((await loadTxCounts([A], { fetcher: down, rpcUrls: ["https://one", "https://two"] })).size, 0);
});

test("serves repeat lookups from the cache", async () => {
  const log: string[] = [];
  const fetcher = rpc((calls) => calls.map((c) => ({ id: c.id, result: "0x3" })), log);
  await loadTxCounts([A], { fetcher, rpcUrls: ["https://one"], now: 1_000 });
  await loadTxCounts([A], { fetcher, rpcUrls: ["https://one"], now: 2_000 });
  assert.equal(log.length, 1);
  await loadTxCounts([A], { fetcher, rpcUrls: ["https://one"], now: 1_000 + 11 * 60 * 1000 });
  assert.equal(log.length, 2);
});

test("backs off for a minute after every RPC failed", async () => {
  const log: string[] = [];
  const down = (async (url: string) => {
    log.push(url);
    throw new Error("offline");
  }) as unknown as typeof fetch;
  await loadTxCounts([C], { fetcher: down, rpcUrls: ["https://one"], now: 1_000 });
  await loadTxCounts([C], { fetcher: down, rpcUrls: ["https://one"], now: 30_000 });
  assert.equal(log.length, 1);
  await loadTxCounts([C], { fetcher: down, rpcUrls: ["https://one"], now: 62_000 });
  assert.equal(log.length, 2);
});

test("reads every wallet past 500 in batches (no silent cap)", async () => {
  const wallets = Array.from({ length: 1234 }, (_, i) => `0x${i.toString(16).padStart(40, "0")}`);
  let calls = 0;
  const fetcher = rpc((batch) => {
    calls += 1;
    return batch.map((c) => ({ id: c.id, result: "0x1" }));
  });
  const counts = await loadTxCounts(wallets, { fetcher, rpcUrls: ["https://one"] });
  assert.equal(counts.size, 1234);
  assert.equal(calls, Math.ceil(1234 / 50));
});

test("serves the persistent store instantly and never blocks past the budget", async () => {
  const stored = new Map([[A.toLowerCase(), { count: 7, at: Date.now() }]]);
  const writes: Map<string, number>[] = [];
  const store = {
    read: async () => stored,
    write: async (entries: Map<string, number>) => void writes.push(entries),
  };
  const slow = (async () => new Promise(() => undefined)) as unknown as typeof fetch;
  const started = Date.now();
  const counts = await loadTxCounts([A, B], { fetcher: slow, rpcUrls: ["https://one"], store, budgetMs: 50 });
  assert.ok(Date.now() - started < 1000);
  assert.equal(counts.get(A.toLowerCase()), 7);
  assert.equal(counts.has(B), false);
});
