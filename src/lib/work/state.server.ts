import { getSql } from "@/lib/db";
import { assertSameOrigin } from "@/lib/passport/origin.server";
import { findProfileForWallet } from "@/lib/passport/repo.server";
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
  const { resolveViewer } = await import("@/lib/chog/actor.server");
  let viewer;
  try {
    viewer = await resolveViewer({ fresh: true });
  } catch (error) {
    return { ok: false as const, error: error instanceof Error ? error.message : "Chog ownership could not be checked." };
  }
  if (!viewer.wallet) return { ok: false as const, error: "Sign in with your wallet before continuing." };
  if (!viewer.actor) return { ok: false as const, error: "Act as a Chog you own first. Without a Chog you can view, not act." };
  const profile = await findProfileForWallet(viewer.sql, viewer.actor);
  if (!profile) return { ok: false as const, error: "Save this Chog's passport before you submit work." };
  return { ok: true as const, sql: viewer.sql, wallet: viewer.actor };
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
  if (input.action === "accepted") {
    const row = await auth.sql<{ contributor_wallet: string }>`select contributor_wallet from work_submissions where id = ${input.id}`;
    const other = row[0]?.contributor_wallet;
    if (other && other !== auth.wallet) {
      const { sameOwner } = await import("@/lib/chog/actor.server");
      if (await sameOwner(other, auth.wallet).catch(() => true)) {
        return { ok: false as const, error: "Both Chogs are held by the same wallet, so this review can't accept the work." };
      }
    }
  }
  return reviewWork(auth.sql, auth.wallet, input.id, input.action, input.comment, input.privateNote);
}

export async function loadPublicWork(username: string) {
  const sql = await getSql();
  return publicContributions(sql, username);
}
