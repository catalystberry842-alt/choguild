import {
  applyToOpportunity,
  createOpportunity,
  getApplication,
  getOpportunity,
  listMyApplications,
  listOpportunities,
  listOpportunityApplications,
  listOwnedOpportunities,
  setApplicationStatus,
  setOpportunityStatus,
  updateOpportunity,
  withdrawApplication,
} from "@/lib/board/repo.server";
import type { BoardSearch } from "@/lib/board/search";
import { assertSameOrigin } from "@/lib/passport/origin.server";
import { findProfileForWallet } from "@/lib/passport/repo.server";
import type { ApplicationInput, OpportunityInput } from "@/lib/board/validate";
import type { ReviewStatus } from "@/lib/board/copy";

async function viewerWallet() {
  const { resolveViewer } = await import("@/lib/chog/actor.server");
  const viewer = await resolveViewer();
  return { sql: viewer.sql, wallet: viewer.actor };
}

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
  if (!profile) return { ok: false as const, error: "Save this Chog's passport before you publish or apply." };
  return { ok: true as const, sql: viewer.sql, wallet: viewer.actor, profile };
}

/** Blocks a wallet's Chogs from hiring or reviewing each other (same live owner). */
async function selfDealing(a: string | null | undefined, b: string | null | undefined): Promise<string | null> {
  if (!a || !b) return null;
  const { sameOwner } = await import("@/lib/chog/actor.server");
  try {
    if (await sameOwner(a, b)) return "Both Chogs are held by the same wallet. Chogs can't hire or review a Chog from their own wallet.";
  } catch {
    return "Monad RPC is unreachable, so ownership can't be checked. Try again in a moment.";
  }
  return null;
}

export async function loadBoard(search: BoardSearch) {
  const { sql, wallet } = await viewerWallet();
  return listOpportunities(sql, search, wallet);
}

export async function loadOpportunity(id: string) {
  const { sql, wallet } = await viewerWallet();
  return getOpportunity(sql, id, wallet);
}

export async function loadOwned() {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return { ok: true as const, items: await listOwnedOpportunities(auth.sql, auth.wallet) };
}

export async function publishOpportunity(input: OpportunityInput) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return createOpportunity(auth.sql, auth.wallet, input);
}

export async function editOpportunity(input: { id: string; opportunity: OpportunityInput }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return updateOpportunity(auth.sql, auth.wallet, input.id, input.opportunity);
}

export async function changeOpportunityStatus(input: { id: string; status: "open" | "closed" | "filled" }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return setOpportunityStatus(auth.sql, auth.wallet, input.id, input.status);
}

export async function submitApplication(input: { opportunityId: string; application: ApplicationInput }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  const owner = await auth.sql<{ owner_wallet: string }>`select owner_wallet from opportunities where id = ${input.opportunityId}`;
  const blocked = await selfDealing(owner[0]?.owner_wallet, auth.wallet);
  if (blocked && owner[0]?.owner_wallet !== auth.wallet) return { ok: false as const, error: blocked };
  // Acting as a Chog already proves holdership (live ownerOf), so holders-only listings are satisfied.
  return applyToOpportunity(auth.sql, auth.wallet, input.opportunityId, input.application, async () => true);
}

export async function pullApplication(id: string) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return withdrawApplication(auth.sql, auth.wallet, id);
}

export async function reviewApplication(input: { id: string; status: ReviewStatus; feedback: string }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  if (input.status === "accepted" || input.status === "shortlisted") {
    const row = await auth.sql<{ contributor_wallet: string }>`select contributor_wallet from applications where id = ${input.id}`;
    const blocked = await selfDealing(row[0]?.contributor_wallet, auth.wallet);
    if (blocked) return { ok: false as const, error: blocked };
  }
  return setApplicationStatus(auth.sql, auth.wallet, input.id, input.status, input.feedback);
}

export async function loadMyApplications() {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return { ok: true as const, items: await listMyApplications(auth.sql, auth.wallet) };
}

export async function loadApplication(id: string) {
  const { sql, wallet } = await viewerWallet();
  if (!wallet) return null;
  return getApplication(sql, wallet, id);
}

export async function loadReviews(opportunityId: string) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return listOpportunityApplications(auth.sql, auth.wallet, opportunityId);
}
