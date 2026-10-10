import { getSql } from "@/lib/db";
import { assertSameOrigin } from "@/lib/passport/origin.server";
import { findProfileForWallet, readLiveSession } from "@/lib/passport/repo.server";
import { clearSessionRecord, readSessionRecord } from "@/lib/passport/session.server";
import type { ReviewAction } from "@/lib/work/copy";
import {
  createWork,
  getWork,
  listEligible,
  listMyWork,
  listReviewQueue,
  publicContributions,
  reviewWork,
  updateDraft,
} from "@/lib/work/repo.server";
import type { WorkInput } from "@/lib/work/validate";

async function requireProfile() {
  assertSameOrigin();
  const sql = await getSql();
  const record = await readSessionRecord();
  if (!record) return { ok: false as const, error: "Sign in with your passport before continuing." };
  const live = await readLiveSession(sql, record.sessionId);
  if (!live || live !== record.address) {
    await clearSessionRecord();
    return { ok: false as const, error: "Your passport session expired. Sign in again." };
  }
  const profile = await findProfileForWallet(sql, live);
  if (!profile) return { ok: false as const, error: "Save a Chog Passport before you submit work." };
  return { ok: true as const, sql, wallet: live };
}

export async function loadWorkHome() {
  const auth = await requireProfile();
  if (!auth.ok) return { ok: false as const, error: auth.error, mine: [], review: [], eligible: [] };
  const [mine, review, eligible] = await Promise.all([
    listMyWork(auth.sql, auth.wallet),
    listReviewQueue(auth.sql, auth.wallet, {}),
    listEligible(auth.sql, auth.wallet),
  ]);
  return { ok: true as const, mine, review, eligible };
}

export async function loadWork(id: string) {
  const auth = await requireProfile();
  if (!auth.ok) return null;
  return getWork(auth.sql, auth.wallet, id);
}

export async function startWork(input: { applicationId: string; work: WorkInput }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return createWork(auth.sql, auth.wallet, input.applicationId, input.work);
}

export async function reviseWork(input: { id: string; work: WorkInput }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return updateDraft(auth.sql, auth.wallet, input.id, input.work);
}

export async function decideWork(input: { id: string; action: ReviewAction; comment: string; privateNote: string }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return reviewWork(auth.sql, auth.wallet, input.id, input.action, input.comment, input.privateNote);
}

export async function loadPublicWork(username: string) {
  const sql = await getSql();
  return publicContributions(sql, username);
}
