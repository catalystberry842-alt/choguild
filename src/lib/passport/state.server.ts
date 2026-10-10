import { getSql } from "@/lib/db";
import { getAddress, type Hex } from "viem";
import { assertSameOrigin, requestAuthority } from "@/lib/passport/origin.server";
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

export async function loadPassportState() {
  const sql = await getSql();
  const record = await readSessionRecord();
  if (!record) return { sessionAddress: null as string | null, profile: null };
  const live = await readLiveSession(sql, record.sessionId);
  if (!live || live !== record.address) {
    await clearSessionRecord();
    return { sessionAddress: null as string | null, profile: null };
  }
  const profile = await findProfileForWallet(sql, live);
  return { sessionAddress: getAddress(live), profile };
}

export async function loadPublicProfile(username: string) {
  const sql = await getSql();
  return findPublicProfile(sql, username);
}

export async function beginNonce(input: { address: string; chainId: number }) {
  assertSameOrigin();
  const { domain, uri } = requestAuthority();
  const sql = await getSql();
  return issueNonce(sql, { ...input, domain, uri });
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
  const profile = await findProfileForWallet(sql, consumed.address);
  return { ok: true as const, sessionAddress: getAddress(consumed.address), profile };
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
  const sql = await getSql();
  const record = await readSessionRecord();
  if (!record) return { ok: false as const, error: "Verify your wallet before editing a passport." };
  const live = await readLiveSession(sql, record.sessionId);
  if (!live || live !== record.address) {
    await clearSessionRecord();
    return { ok: false as const, error: "Your passport session expired. Sign in again." };
  }
  if (input.mode === "create") return createProfile(sql, live, input.profile);
  return updateProfile(sql, live, input.profile);
}
