import { monadRpcUrls } from "@/lib/passport/chain";

type Fetch = typeof fetch;

const CACHE_TTL_MS = 10 * 60 * 1000;
const CHUNK = 50;
const TIMEOUT_MS = 6_000;

const cache = new Map<string, { count: number; at: number }>();

/** Clears the in-memory cache (tests). */
export function resetActivityCache() {
  cache.clear();
}

type RpcReply = { id?: number; result?: unknown; error?: unknown };

async function batchNonces(url: string, addresses: string[], fetcher: Fetch): Promise<Map<string, number>> {
  const body = addresses.map((address, id) => ({
    jsonrpc: "2.0",
    id,
    method: "eth_getTransactionCount",
    params: [address, "latest"],
  }));
  const response = await fetcher(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`RPC ${response.status}`);
  const replies = (await response.json()) as unknown;
  if (!Array.isArray(replies)) throw new Error("RPC did not answer the batch");
  const out = new Map<string, number>();
  for (const reply of replies as RpcReply[]) {
    if (typeof reply?.id !== "number" || typeof reply.result !== "string") continue;
    const address = addresses[reply.id];
    const count = Number.parseInt(reply.result, 16);
    if (address && Number.isFinite(count) && count >= 0) out.set(address, count);
  }
  return out;
}

/**
 * Transactions each address has sent on Monad mainnet (its nonce). Uses one
 * batched JSON-RPC call per 50 addresses, tries the official RPCs in order,
 * and caches results for 10 minutes. Addresses the network could not answer
 * for are missing from the result.
 */
export async function loadTxCounts(
  addresses: string[],
  options: { fetcher?: Fetch; rpcUrls?: string[]; now?: number } = {},
): Promise<Map<string, number>> {
  const fetcher = options.fetcher ?? fetch;
  const urls = options.rpcUrls ?? monadRpcUrls(process.env.VITE_MONAD_RPC_URL).slice(0, 3);
  const now = options.now ?? Date.now();
  const unique = [...new Set(addresses.map((address) => address.toLowerCase()))].slice(0, 500);

  const result = new Map<string, number>();
  const missing: string[] = [];
  for (const address of unique) {
    const hit = cache.get(address);
    if (hit && now - hit.at < CACHE_TTL_MS) result.set(address, hit.count);
    else missing.push(address);
  }

  for (let i = 0; i < missing.length; i += CHUNK) {
    const chunk = missing.slice(i, i + CHUNK);
    for (const url of urls) {
      try {
        const counts = await batchNonces(url, chunk, fetcher);
        for (const [address, count] of counts) {
          result.set(address, count);
          cache.set(address, { count, at: now });
        }
        break;
      } catch {
        // Try the next RPC; if all fail these addresses stay unknown.
      }
    }
  }
  return result;
}
