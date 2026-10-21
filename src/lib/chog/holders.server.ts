import { createPublicClient, fallback, http, parseAbi } from "viem";
import { monad, monadRpcUrls } from "@/lib/passport/chain";
import { CHOG_CONTRACT, CHOG_SUPPLY, imagePathFromTokenUri, type ChogHolding } from "./chog";

const MULTICALL3 = "0xcA11bde05977b3631167028862bE2a173976CA11" as const;
const SNAPSHOT_TTL_MS = 5 * 60 * 1000;
const FAILURE_BACKOFF_MS = 60 * 1000;
const abi = parseAbi([
  "function ownerOf(uint256) view returns (address)",
  "function balanceOf(address) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function tokenURI(uint256) view returns (string)",
]);

let client: ReturnType<typeof createPublicClient> | undefined;
function rpc() {
  client ??= createPublicClient({
    chain: monad,
    transport: fallback(monadRpcUrls(process.env.VITE_MONAD_RPC_URL).slice(0, 5).map((url) => http(url, { timeout: 8_000, retryCount: 0 }))),
  });
  return client;
}

type Snapshot = { at: number; owners: Map<string, number[]> };
const holder = globalThis as typeof globalThis & {
  __chogSnapshot?: Snapshot;
  __chogInflight?: Promise<Snapshot | null>;
  __chogFailedAt?: number;
  __chogUris?: Map<number, string>;
};

/** Builds owner → token ids from ownerOf(1..supply) via Multicall3 (≈2k calls in one round trip). */
async function buildSnapshot(): Promise<Snapshot> {
  const supply = Number(await rpc().readContract({ address: CHOG_CONTRACT, abi, functionName: "totalSupply" }));
  const ids = Array.from({ length: Math.min(supply || CHOG_SUPPLY, 10_000) }, (_, i) => i + 1);
  const results = await rpc().multicall({
    contracts: ids.map((id) => ({ address: CHOG_CONTRACT, abi, functionName: "ownerOf", args: [BigInt(id)] }) as const),
    allowFailure: true,
    batchSize: 64_000,
    multicallAddress: MULTICALL3,
  });
  const owners = new Map<string, number[]>();
  results.forEach((result, index) => {
    if (result.status !== "success" || typeof result.result !== "string") return;
    const key = result.result.toLowerCase();
    const list = owners.get(key) ?? [];
    list.push(ids[index]);
    owners.set(key, list);
  });
  return { at: Date.now(), owners };
}

async function loadPersisted(): Promise<Snapshot | null> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const rows = await sql<{ owners: unknown; built_at: string }>`select owners, built_at::text as built_at from chog_snapshot where id = 1`;
    const row = rows[0];
    if (!row) return null;
    const raw = (typeof row.owners === "string" ? JSON.parse(row.owners) : row.owners) as Record<string, number[]>;
    return { at: Date.parse(row.built_at), owners: new Map(Object.entries(raw)) };
  } catch {
    return null;
  }
}

async function persist(snapshot: Snapshot): Promise<void> {
  try {
    const { getSql } = await import("@/lib/db");
    const sql = await getSql();
    const owners = JSON.stringify(Object.fromEntries(snapshot.owners));
    await sql`
      insert into chog_snapshot (id, owners, built_at) values (1, ${owners}::jsonb, ${new Date(snapshot.at).toISOString()})
      on conflict (id) do update set owners = excluded.owners, built_at = excluded.built_at
    `;
  } catch {
    // Persistence is best effort; the in-memory snapshot still serves this instance.
  }
}

function refresh(cached: Snapshot | undefined): Promise<Snapshot | null> {
  holder.__chogInflight ??= buildSnapshot()
    .then((snap) => {
      holder.__chogSnapshot = snap;
      void persist(snap);
      return snap;
    })
    .catch(() => {
      holder.__chogFailedAt = Date.now();
      return cached ?? null;
    })
    .finally(() => {
      holder.__chogInflight = undefined;
    });
  return holder.__chogInflight;
}

/**
 * Current holder snapshot. Never blocks a render on the ~2k-call rebuild:
 * memory first, then the last snapshot persisted in Postgres (stale is fine),
 * and a background rebuild when older than 5 minutes. With nothing cached at
 * all it waits at most `budgetMs` and then returns null (shown as unavailable).
 */
export async function chogSnapshot(options: { budgetMs?: number } = {}): Promise<Snapshot | null> {
  let cached = holder.__chogSnapshot;
  if (cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) return cached;
  if (!cached) {
    const stored = await loadPersisted();
    if (stored) cached = holder.__chogSnapshot = stored;
    if (cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) return cached;
  }
  const backingOff = Date.now() - (holder.__chogFailedAt ?? -Infinity) < FAILURE_BACKOFF_MS;
  if (backingOff) return cached ?? null;
  const inflight = refresh(cached);
  if (cached) return cached; // stale-while-revalidate
  if (options.budgetMs === undefined) return inflight;
  return Promise.race([inflight, new Promise<null>((resolve) => setTimeout(() => resolve(null), options.budgetMs))]);
}

export function holdingFrom(snapshot: Snapshot | null, wallet: string): ChogHolding | null {
  if (!snapshot) return null;
  const tokenIds = snapshot.owners.get(wallet.toLowerCase()) ?? [];
  return { count: tokenIds.length, tokenIds: tokenIds.slice(0, 12) };
}

export async function holdingsFor(wallets: string[], options: { budgetMs?: number } = {}): Promise<Map<string, ChogHolding> | null> {
  const snapshot = await chogSnapshot(options);
  if (!snapshot) return null;
  return new Map(wallets.map((wallet) => [wallet.toLowerCase(), holdingFrom(snapshot, wallet)!]));
}

/** Authoritative live check for gated actions: balanceOf right now (no cache). */
export async function isChogHolderNow(wallet: string): Promise<boolean | null> {
  try {
    const balance = await rpc().readContract({ address: CHOG_CONTRACT, abi, functionName: "balanceOf", args: [wallet as `0x${string}`] });
    return balance > 0n;
  } catch {
    return null;
  }
}

/** Authoritative live owner check for one token: true/false, or null when the chain can't be read. */
export async function ownsChogNow(wallet: string, tokenId: number): Promise<boolean | null> {
  try {
    const owner = await rpc().readContract({ address: CHOG_CONTRACT, abi, functionName: "ownerOf", args: [BigInt(tokenId)] });
    return owner.toLowerCase() === wallet.toLowerCase();
  } catch {
    return null;
  }
}

/** IPFS path of a token's image (tokenURI is immutable per token, so cached forever). */
export async function chogImagePath(tokenId: number): Promise<string | null> {
  holder.__chogUris ??= new Map();
  let uri = holder.__chogUris.get(tokenId);
  if (!uri) {
    uri = await rpc().readContract({ address: CHOG_CONTRACT, abi, functionName: "tokenURI", args: [BigInt(tokenId)] });
    holder.__chogUris.set(tokenId, uri);
  }
  return imagePathFromTokenUri(uri);
}
