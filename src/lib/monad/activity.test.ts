import assert from "node:assert/strict";
import { beforeEach, test } from "node:test";
import { loadTxCounts, resetActivityCache } from "./activity.server.ts";

const A = "0x00000000000000000000000000000000000000AA";
const B = "0x00000000000000000000000000000000000000bb";

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
