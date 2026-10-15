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

/** Current holder snapshot (cached 5 min). Null only if the chain has never been readable. */
export async function chogSnapshot(): Promise<Snapshot | null> {
  const cached = holder.__chogSnapshot;
  if (cached && Date.now() - cached.at < SNAPSHOT_TTL_MS) return cached;
  if (Date.now() - (holder.__chogFailedAt ?? -Infinity) < FAILURE_BACKOFF_MS) return cached ?? null;
  holder.__chogInflight ??= buildSnapshot()
    .then((snap) => (holder.__chogSnapshot = snap))
    .catch(() => {
      holder.__chogFailedAt = Date.now();
      return cached ?? null;
    })
    .finally(() => {
      holder.__chogInflight = undefined;
    });
  return holder.__chogInflight;
}

export function holdingFrom(snapshot: Snapshot | null, wallet: string): ChogHolding | null {
  if (!snapshot) return null;
  const tokenIds = snapshot.owners.get(wallet.toLowerCase()) ?? [];
  return { count: tokenIds.length, tokenIds: tokenIds.slice(0, 12) };
}

export async function holdingsFor(wallets: string[]): Promise<Map<string, ChogHolding> | null> {
  const snapshot = await chogSnapshot();
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
