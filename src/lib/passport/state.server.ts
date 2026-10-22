import { getSql } from "@/lib/db";
import { getAddress, type Hex } from "viem";
import { assertSameOrigin, requestAuthority, requesterKey } from "@/lib/passport/origin.server";
import {
  consumeNonce,
  createPassportSession,
  createProfile,
  deletePassportSession,
  findProfileForWallet,
  findPublicProfile,
  issueNonce,
  readLiveSession,
  updateProfile,
} from "@/lib/passport/repo.server";
import { clearSessionRecord, readSessionRecord, writeSessionRecord } from "@/lib/passport/session.server";
import type { ProfileInput } from "@/lib/passport/validate";

async function ownedChogIds(wallet: string): Promise<number[] | null> {
  const { chogSnapshot } = await import("@/lib/chog/holders.server");
  const snap = await chogSnapshot({ budgetMs: 3_000 }).catch(() => null);
  return snap ? [...(snap.owners.get(wallet.toLowerCase()) ?? [])].sort((a, b) => a - b) : null;
}

export async function loadPassportState() {
  const { resolveViewer, selectActingChog } = await import("@/lib/chog/actor.server");
  let viewer = await resolveViewer();
  if (!viewer.wallet) return { sessionAddress: null as string | null, chogId: null as number | null, ownedChogs: [] as number[], ownedKnown: true, profile: null };
  const owned = await ownedChogIds(viewer.wallet);
  if (!viewer.chogId && owned && owned.length === 1) {
    const picked = await selectActingChog(owned[0]);
    if (picked.ok) viewer = await resolveViewer();
  }
  const ids = owned ?? [];
  if (viewer.chogId && !ids.includes(viewer.chogId)) ids.push(viewer.chogId);
  const profile = viewer.actor ? await findProfileForWallet(viewer.sql, viewer.actor) : null;
  return { sessionAddress: getAddress(viewer.wallet!), chogId: viewer.chogId, ownedChogs: ids.sort((a, b) => a - b), ownedKnown: owned !== null, profile };
}

export async function chooseChog(chogId: number | null) {
  assertSameOrigin();
  const { selectActingChog } = await import("@/lib/chog/actor.server");
  return selectActingChog(chogId);
}

export async function loadPublicProfile(username: string) {
  const sql = await getSql();
  return findPublicProfile(sql, username);
}

export async function beginNonce(input: { address: string; chainId: number }) {
  assertSameOrigin();
  const { domain, uri } = requestAuthority();
  const sql = await getSql();
  return issueNonce(sql, { ...input, domain, uri, requester: requesterKey() });
}

export async function finishSignature(input: { message: string; signature: Hex }) {
  assertSameOrigin();
  const { domain } = requestAuthority();
  const sql = await getSql();
  const consumed = await consumeNonce(sql, { message: input.message, signature: input.signature, domain });
  if (!consumed.ok) return consumed;
  const previous = await readSessionRecord();
  if (previous) await deletePassportSession(sql, previous.sessionId);
  const sessionId = await createPassportSession(sql, consumed.address);
  try {
    await writeSessionRecord({ sessionId, address: consumed.address });
  } catch (error) {
    await deletePassportSession(sql, sessionId);
    throw error;
  }
  return { ok: true as const, sessionAddress: getAddress(consumed.address), profile: null };
}

export async function finishEndSession() {
  assertSameOrigin();
  const sql = await getSql();
  const record = await readSessionRecord();
  if (record) await deletePassportSession(sql, record.sessionId);
  await clearSessionRecord();
  return { ok: true as const };
}

export async function finishSave(input: { mode: "create" | "update"; profile: ProfileInput }) {
  assertSameOrigin();
  const { resolveViewer } = await import("@/lib/chog/actor.server");
  const { chogImageUrl } = await import("@/lib/chog/chog");
  let viewer;
  try {
    viewer = await resolveViewer({ fresh: true });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Chog ownership could not be checked." };
  }
  if (!viewer.wallet) return { ok: false as const, error: "Verify your wallet before editing a passport." };
  if (!viewer.actor || !viewer.chogId) return { ok: false as const, error: "Pick a Chog you own to act as. Without a Chog you can view, not act." };
  // The Chog is the member, so its passport face is always its own token image.
  const profile = { ...input.profile, avatarUrl: chogImageUrl(viewer.chogId) };
  if (input.mode === "create") return createProfile(viewer.sql, viewer.actor, profile);
  return updateProfile(viewer.sql, viewer.actor, profile);
}

/** Signed-in actor (chog:<id>) for a raw API route, or null. Same-origin + rate limits apply. */
export async function liveSessionWallet(): Promise<string | null> {
  assertSameOrigin();
  const sql = await getSql();
  const record = await readSessionRecord();
  if (!record) return null;
  const live = await readLiveSession(sql, record.sessionId);
  if (!live || live !== record.address) return null;
  const { resolveViewer } = await import("@/lib/chog/actor.server");
  const viewer = await resolveViewer();
  return viewer.actor;
}
