import type { Sql } from "@/lib/db";
import { getSql } from "@/lib/db";
import { createPublicClient, fallback, http, parseAbi } from "viem";
import { monad, monadRpcUrls } from "@/lib/passport/chain";
import { CHOG_CONTRACT, isChogTokenId } from "./chog";
import { actorKey } from "./actor";
import { readLiveSession } from "@/lib/passport/repo.server";
import { clearSessionRecord, readSessionRecord, writeSessionRecord } from "@/lib/passport/session.server";

const abi = parseAbi(["function ownerOf(uint256) view returns (address)"]);
const OWNER_TTL_MS = 30_000;
const g = globalThis as typeof globalThis & {
  __chogOwnerClient?: ReturnType<typeof createPublicClient>;
  __chogOwners?: Map<number, { owner: string | null; at: number }>;
};

function client() {
  g.__chogOwnerClient ??= createPublicClient({
    chain: monad,
    transport: fallback(monadRpcUrls(process.env.VITE_MONAD_RPC_URL).slice(0, 5).map((url) => http(url, { timeout: 6_000, retryCount: 0 }))),
  });
  return g.__chogOwnerClient;
}

/** Live ownerOf (lowercase). `fresh` skips the 30s cache; used before every write. Throws when the chain can't be read. */
export async function liveOwnerOf(tokenId: number, options: { fresh?: boolean } = {}): Promise<string | null> {
  if (!isChogTokenId(tokenId)) return null;
  g.__chogOwners ??= new Map();
  const hit = g.__chogOwners.get(tokenId);
  if (!options.fresh && hit && Date.now() - hit.at < OWNER_TTL_MS) return hit.owner;
  try {
    const owner = (await client().readContract({ address: CHOG_CONTRACT, abi, functionName: "ownerOf", args: [BigInt(tokenId)] })).toLowerCase();
    g.__chogOwners.set(tokenId, { owner, at: Date.now() });
    return owner;
  } catch (error) {
    if (hit) return hit.owner;
    throw error;
  }
}

export type Viewer = {
  sql: Sql;
  /** Verified wallet (lowercase) or null when signed out. */
  wallet: string | null;
  /** Token the wallet is acting as, verified live, or null (view only). */
  chogId: number | null;
  /** `chog:<id>` or null. All data is keyed by this. */
  actor: string | null;
};

/** Reads the session and re-checks that the wallet still owns its acting Chog (drops it after a transfer). */
export async function resolveViewer(options: { fresh?: boolean } = {}): Promise<Viewer> {
  const sql = await getSql();
  const record = await readSessionRecord();
  if (!record) return { sql, wallet: null, chogId: null, actor: null };
  const live = await readLiveSession(sql, record.sessionId);
  if (!live || live !== record.address) {
    await clearSessionRecord();
    return { sql, wallet: null, chogId: null, actor: null };
  }
  const chogId = record.chogId ?? null;
  if (!chogId) return { sql, wallet: live, chogId: null, actor: null };
  let owner: string | null;
  try {
    owner = await liveOwnerOf(chogId, options);
  } catch {
    if (options.fresh) throw new Error("Monad RPC is unreachable, so Chog ownership can't be checked. Try again in a moment.");
    owner = live; // read-only views tolerate a blip; writes always pass fresh
  }
  if (owner !== live) {
    await writeSessionRecord({ sessionId: record.sessionId, address: record.address, chogId: null }).catch(() => undefined);
    return { sql, wallet: live, chogId: null, actor: null };
  }
  return { sql, wallet: live, chogId, actor: actorKey(chogId) };
}

/**
 * First time a wallet acts as a Chog: if that Chog has no passport yet and the wallet still has a
 * pre-v3 wallet-keyed passport, move the passport and its whole work history onto the Chog.
 */
export async function adoptLegacyRecord(sql: Sql, wallet: string, chogId: number): Promise<boolean> {
  const actor = actorKey(chogId);
  const existing = await sql<{ id: string }>`select id from contributor_profiles where wallet_address = ${actor}`;
  if (existing[0]) return false;
  const legacy = await sql<{ id: string }>`select id from contributor_profiles where wallet_address = ${wallet}`;
  if (!legacy[0]) return false;
  await sql`update contributor_profiles set wallet_address = ${actor}, updated_at = now() where wallet_address = ${wallet}`;
  await sql`update opportunities set owner_wallet = ${actor} where owner_wallet = ${wallet}`;
  await sql`update applications set contributor_wallet = ${actor} where contributor_wallet = ${wallet}`;
  await sql`update work_submissions set contributor_wallet = ${actor} where contributor_wallet = ${wallet}`;
  await sql`update submission_events set actor_wallet = ${actor} where actor_wallet = ${wallet}`;
  await sql`update passport_avatars set wallet_address = ${actor} where wallet_address = ${wallet}`;
  return true;
}

/** Switches the Chog the signed-in wallet acts as. Requires live ownerOf == wallet. */
export async function selectActingChog(chogId: number | null) {
  const sql = await getSql();
  const record = await readSessionRecord();
  if (!record) return { ok: false as const, error: "Sign in with your wallet first." };
  const live = await readLiveSession(sql, record.sessionId);
  if (!live || live !== record.address) return { ok: false as const, error: "Your session expired. Sign in again." };
  if (chogId === null) {
    await writeSessionRecord({ sessionId: record.sessionId, address: record.address, chogId: null });
    return { ok: true as const, chogId: null, adopted: false };
  }
  let owner: string | null;
  try {
    owner = await liveOwnerOf(chogId, { fresh: true });
  } catch {
    return { ok: false as const, error: "Monad RPC is unreachable, so Chog ownership can't be checked. Try again." };
  }
  if (owner !== live) return { ok: false as const, error: `This wallet doesn't own Chog #${chogId} right now.` };
  const adopted = await adoptLegacyRecord(sql, live, chogId);
  await writeSessionRecord({ sessionId: record.sessionId, address: record.address, chogId });
  return { ok: true as const, chogId, adopted };
}

/** Self-dealing guard: two Chogs held by the same wallet can't hire or review each other. */
export async function sameOwner(a: string, b: string): Promise<boolean> {
  const ia = Number(a.slice(5));
  const ib = Number(b.slice(5));
  if (!a.startsWith("chog:") || !b.startsWith("chog:")) return a === b;
  if (ia === ib) return true;
  const [oa, ob] = await Promise.all([liveOwnerOf(ia, { fresh: true }), liveOwnerOf(ib, { fresh: true })]);
  return Boolean(oa && oa === ob);
}
