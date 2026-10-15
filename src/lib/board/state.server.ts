import { getSql } from "@/lib/db";
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
import { findProfileForWallet, readLiveSession } from "@/lib/passport/repo.server";
import { clearSessionRecord, readSessionRecord } from "@/lib/passport/session.server";
import type { ApplicationInput, OpportunityInput } from "@/lib/board/validate";
import type { ReviewStatus } from "@/lib/board/copy";

async function viewerWallet() {
  const sql = await getSql();
  const record = await readSessionRecord();
  if (!record) return { sql, wallet: null as string | null };
  const live = await readLiveSession(sql, record.sessionId);
  if (!live || live !== record.address) {
    await clearSessionRecord();
    return { sql, wallet: null as string | null };
  }
  return { sql, wallet: live };
}

async function requireProfile() {
  assertSameOrigin();
  const { sql, wallet } = await viewerWallet();
  if (!wallet) return { ok: false as const, error: "Sign in with your passport before continuing." };
  const profile = await findProfileForWallet(sql, wallet);
  if (!profile) return { ok: false as const, error: "Save a Chog Passport before you publish or apply." };
  return { ok: true as const, sql, wallet, profile };
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
  const { isChogHolderNow } = await import("@/lib/chog/holders.server");
  return applyToOpportunity(auth.sql, auth.wallet, input.opportunityId, input.application, isChogHolderNow);
}

export async function pullApplication(id: string) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
  return withdrawApplication(auth.sql, auth.wallet, id);
}

export async function reviewApplication(input: { id: string; status: ReviewStatus; feedback: string }) {
  const auth = await requireProfile();
  if (!auth.ok) return auth;
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
