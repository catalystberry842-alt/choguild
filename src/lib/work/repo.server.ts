import type { Sql } from "@/lib/db";
import type { WorkStatus } from "@/lib/work/copy";
import { reviewerCan, WORK_STATUSES } from "@/lib/work/copy";
import type { ContributionSummary, EligibleWork, PublicContribution, WorkDetail, WorkEvent, WorkListItem, WorkVersion } from "@/lib/work/types";
import { validateReviewComment, validateWork, type WorkErrors, type WorkInput } from "@/lib/work/validate";

function asStrings(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value) as unknown;
      return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
    } catch {
      return [];
    }
  }
  return [];
}

function statusOf(value: string): WorkStatus {
  return WORK_STATUSES.includes(value as WorkStatus) ? (value as WorkStatus) : "draft";
}

async function versions(sql: Sql, submissionId: string): Promise<WorkVersion[]> {
  const rows = await sql.query<{
    version: number;
    title: string;
    description: string;
    repo_url: string | null;
    document_url: string | null;
    notes: string | null;
    evidence_links: unknown;
    created_at: string;
  }>(
    `select version, title, description, repo_url, document_url, notes, evidence_links,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
     from submission_versions where submission_id = $1 order by version asc`,
    [submissionId],
  );
  return rows.map((row) => ({
    version: Number(row.version),
    title: row.title,
    description: row.description,
    repoUrl: row.repo_url,
    documentUrl: row.document_url,
    notes: row.notes,
    evidenceLinks: asStrings(row.evidence_links),
    createdAt: row.created_at,
  }));
}

async function events(sql: Sql, submissionId: string, includePrivate: boolean): Promise<WorkEvent[]> {
  const rows = await sql.query<{
    from_status: string | null;
    to_status: string;
    comment: string | null;
    private_note: string | null;
    created_at: string;
  }>(
    `select from_status, to_status, comment, private_note,
      to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
     from submission_events where submission_id = $1 order by created_at asc`,
    [submissionId],
  );
  return rows.map((row) => ({
    fromStatus: row.from_status,
    toStatus: row.to_status,
    comment: row.comment,
    privateNote: includePrivate ? row.private_note : null,
    createdAt: row.created_at,
  }));
}

type Head = {
  id: string;
  opportunity_id: string;
  application_id: string;
  contributor_wallet: string;
  owner_wallet: string;
  status: string;
  public_evidence: boolean;
  title: string;
  project_name: string;
  created_at: string;
  updated_at: string;
};

async function head(sql: Sql, id: string): Promise<Head | null> {
  const rows = await sql.query<Head>(
    `select w.id, w.opportunity_id, w.application_id, w.contributor_wallet, o.owner_wallet, w.status,
      w.public_evidence, o.title, o.project_name,
      to_char(w.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
      to_char(w.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
     from work_submissions w
     join opportunities o on o.id = w.opportunity_id
     where w.id = $1`,
    [id],
  );
  return rows[0] ?? null;
}

async function toDetail(sql: Sql, row: Head, viewer: "contributor" | "reviewer"): Promise<WorkDetail> {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.title,
    projectName: row.project_name,
    applicationId: row.application_id,
    status: statusOf(row.status),
    publicEvidence: row.public_evidence,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    viewer,
    versions: await versions(sql, row.id),
    history: await events(sql, row.id, viewer === "reviewer"),
  };
}

export async function getWork(sql: Sql, wallet: string, id: string): Promise<WorkDetail | null> {
  const row = await head(sql, id);
  if (!row) return null;
  const viewer = row.contributor_wallet === wallet ? "contributor" : row.owner_wallet === wallet ? "reviewer" : null;
  if (!viewer) return null;
  return toDetail(sql, row, viewer);
}

export async function listEligible(sql: Sql, wallet: string): Promise<EligibleWork[]> {
  const rows = await sql.query<{ application_id: string; opportunity_id: string; title: string; project_name: string }>(
    `select a.id as application_id, o.id as opportunity_id, o.title, o.project_name
     from applications a
     join opportunities o on o.id = a.opportunity_id
     left join work_submissions w on w.application_id = a.id
     where a.contributor_wallet = $1 and a.status = 'accepted' and w.id is null
     order by a.updated_at desc`,
    [wallet],
  );
  return rows.map((row) => ({
    applicationId: row.application_id,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.title,
    projectName: row.project_name,
  }));
}

export async function listMyWork(sql: Sql, wallet: string): Promise<WorkListItem[]> {
  const rows = await sql.query<{
    id: string;
    opportunity_id: string;
    title: string;
    project_name: string;
    work_title: string;
    status: string;
    updated_at: string;
  }>(
    `select w.id, w.opportunity_id, o.title, o.project_name, v.title as work_title, w.status,
      to_char(w.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at
     from work_submissions w
     join opportunities o on o.id = w.opportunity_id
     join submission_versions v on v.submission_id = w.id
       and v.version = (select max(version) from submission_versions where submission_id = w.id)
     where w.contributor_wallet = $1
     order by w.updated_at desc`,
    [wallet],
  );
  return rows.map((row) => ({
    id: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.title,
    projectName: row.project_name,
    title: row.work_title,
    status: statusOf(row.status),
    updatedAt: row.updated_at,
    username: null,
    displayName: null,
  }));
}

export async function listReviewQueue(
  sql: Sql,
  owner: string,
  filter: { status?: string; opportunityId?: string },
): Promise<WorkListItem[]> {
  const params: unknown[] = [owner];
  const where = ["o.owner_wallet = $1", "w.contributor_wallet <> $1", "w.status <> 'draft'"];
  if (filter.status && WORK_STATUSES.includes(filter.status as WorkStatus) && filter.status !== "draft") {
    params.push(filter.status);
    where.push(`w.status = $${params.length}`);
  }
  if (filter.opportunityId) {
    params.push(filter.opportunityId);
    where.push(`w.opportunity_id = $${params.length}`);
  }
  const rows = await sql.query<{
    id: string;
    opportunity_id: string;
    title: string;
    project_name: string;
    work_title: string;
    status: string;
    updated_at: string;
    username: string | null;
    display_name: string | null;
  }>(
    `select w.id, w.opportunity_id, o.title, o.project_name, v.title as work_title, w.status,
      to_char(w.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at,
      p.username, p.display_name
     from work_submissions w
     join opportunities o on o.id = w.opportunity_id
     join submission_versions v on v.submission_id = w.id
       and v.version = (select max(version) from submission_versions where submission_id = w.id)
     left join contributor_profiles p on p.wallet_address = w.contributor_wallet
     where ${where.join(" and ")}
     order by w.updated_at desc`,
    params,
  );
  return rows.map((row) => ({
    id: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.title,
    projectName: row.project_name,
    title: row.work_title,
    status: statusOf(row.status),
    updatedAt: row.updated_at,
    username: row.username,
    displayName: row.display_name,
  }));
}

async function acceptedApplication(sql: Sql, wallet: string, applicationId: string) {
  const rows = await sql.query<{ opportunity_id: string; owner_wallet: string }>(
    `select o.id as opportunity_id, o.owner_wallet
     from applications a
     join opportunities o on o.id = a.opportunity_id
     where a.id = $1 and a.contributor_wallet = $2 and a.status = 'accepted'`,
    [applicationId, wallet],
  );
  return rows[0] ?? null;
}

async function writeVersion(sql: Sql, submissionId: string, version: number, value: { title: string; description: string; evidenceLinks: string[]; repoUrl: string | null; documentUrl: string | null; notes: string | null }) {
  await sql.query(
    `insert into submission_versions (id, submission_id, version, title, description, repo_url, document_url, notes, evidence_links)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb)`,
    [crypto.randomUUID(), submissionId, version, value.title, value.description, value.repoUrl, value.documentUrl, value.notes, JSON.stringify(value.evidenceLinks)],
  );
}

async function writeEvent(sql: Sql, submissionId: string, actor: string, fromStatus: string | null, toStatus: string, comment: string | null, note: string | null) {
  await sql.query(
    `insert into submission_events (id, submission_id, actor_wallet, from_status, to_status, comment, private_note)
     values ($1,$2,$3,$4,$5,$6,$7)`,
    [crypto.randomUUID(), submissionId, actor, fromStatus, toStatus, comment, note],
  );
}

export async function createWork(
  sql: Sql,
  wallet: string,
  applicationId: string,
  input: WorkInput,
): Promise<{ ok: true; work: WorkDetail } | { ok: false; error: string; fieldErrors?: WorkErrors }> {
  const parsed = validateWork(input);
  if (!parsed.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.errors };
  const application = await acceptedApplication(sql, wallet, applicationId);
  if (!application) return { ok: false, error: "You can only submit work for an application that was accepted." };
  if (application.owner_wallet === wallet) return { ok: false, error: "You cannot submit work on your own opportunity." };
  const existing = await sql.query<{ id: string }>(`select id from work_submissions where application_id = $1`, [applicationId]);
  if (existing[0]) return { ok: false, error: "This application already has a submission." };
  const id = crypto.randomUUID();
  const status = parsed.value.submit ? "submitted" : "draft";
  try {
    await sql.query(
      `insert into work_submissions (id, opportunity_id, application_id, contributor_wallet, status, public_evidence)
       values ($1,$2,$3,$4,$5,$6)`,
      [id, application.opportunity_id, applicationId, wallet, status, parsed.value.publicEvidence],
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.toLowerCase().includes("work_submissions_one_per_application")) {
      return { ok: false, error: "This application already has a submission." };
    }
    throw error;
  }
  await writeVersion(sql, id, 1, parsed.value);
  await writeEvent(sql, id, wallet, null, status, null, null);
  const work = await getWork(sql, wallet, id);
  if (!work) return { ok: false, error: "The submission was saved but could not be read back." };
  return { ok: true, work };
}

export async function updateDraft(
  sql: Sql,
  wallet: string,
  id: string,
  input: WorkInput,
): Promise<{ ok: true; work: WorkDetail } | { ok: false; error: string; fieldErrors?: WorkErrors }> {
  const parsed = validateWork(input);
  if (!parsed.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.errors };
  const row = await head(sql, id);
  if (!row || row.contributor_wallet !== wallet) return { ok: false, error: "You can only edit your own draft." };
  if (row.status !== "draft" && row.status !== "changes_requested") {
    return { ok: false, error: "This submission can no longer be edited." };
  }
  if (row.status === "draft") {
    await sql.query(
      `update submission_versions set title = $2, description = $3, repo_url = $4, document_url = $5, notes = $6, evidence_links = $7::jsonb
       where submission_id = $1 and version = 1`,
      [id, parsed.value.title, parsed.value.description, parsed.value.repoUrl, parsed.value.documentUrl, parsed.value.notes, JSON.stringify(parsed.value.evidenceLinks)],
    );
    const next = parsed.value.submit ? "submitted" : "draft";
    await sql.query(`update work_submissions set status = $2, public_evidence = $3, updated_at = now() where id = $1`, [id, next, parsed.value.publicEvidence]);
    if (parsed.value.submit) await writeEvent(sql, id, wallet, "draft", "submitted", null, null);
  } else {
    if (!parsed.value.submit) return { ok: false, error: "Send the revision. A requested change cannot go back to a draft." };
    const count = await sql.query<{ version: number }>(`select max(version)::int as version from submission_versions where submission_id = $1`, [id]);
    await writeVersion(sql, id, Number(count[0]?.version ?? 1) + 1, parsed.value);
    await sql.query(`update work_submissions set status = 'submitted', public_evidence = $2, updated_at = now() where id = $1`, [id, parsed.value.publicEvidence]);
    await writeEvent(sql, id, wallet, "changes_requested", "submitted", null, null);
  }
  const work = await getWork(sql, wallet, id);
  if (!work) return { ok: false, error: "The submission was saved but could not be read back." };
  return { ok: true, work };
}

export async function reviewWork(
  sql: Sql,
  owner: string,
  id: string,
  action: "under_review" | "accepted" | "changes_requested" | "rejected",
  comment: string,
  privateNote: string,
): Promise<{ ok: true; work: WorkDetail } | { ok: false; error: string }> {
  const note = validateReviewComment(action, comment, privateNote);
  if (!note.ok) return note;
  const row = await head(sql, id);
  if (!row || row.owner_wallet !== owner || row.contributor_wallet === owner) {
    return { ok: false, error: "You can only review submissions for opportunities you published." };
  }
  if (!reviewerCan(statusOf(row.status), action)) return { ok: false, error: "That status change is not allowed." };
  const updated = await sql.query<{ id: string }>(
    `update work_submissions set status = $3, updated_at = now()
     where id = $1 and status = $2 returning id`,
    [id, row.status, action],
  );
  if (!updated[0]) return { ok: false, error: "That status change is not allowed." };
  await writeEvent(sql, id, owner, row.status, action, note.comment, note.note);
  const work = await getWork(sql, owner, id);
  if (!work) return { ok: false, error: "The review was saved but could not be read back." };
  return { ok: true, work };
}

export async function publicContributions(sql: Sql, username: string): Promise<ContributionSummary> {
  const rows = await sql.query<{
    id: string;
    opportunity_id: string;
    title: string;
    project_name: string;
    opportunity_title: string;
    required_skills: unknown;
    public_evidence: boolean;
    evidence_links: unknown;
    repo_url: string | null;
    document_url: string | null;
    accepted_at: string;
  }>(
    `select w.id, o.id as opportunity_id, v.title, o.project_name, o.title as opportunity_title, o.required_skills, w.public_evidence,
      v.evidence_links, v.repo_url, v.document_url,
      to_char(e.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as accepted_at
     from work_submissions w
     join contributor_profiles p on p.wallet_address = w.contributor_wallet
     join opportunities o on o.id = w.opportunity_id
     join submission_versions v on v.submission_id = w.id
       and v.version = (select max(version) from submission_versions where submission_id = w.id)
     join submission_events e on e.submission_id = w.id and e.to_status = 'accepted'
       and e.created_at = (select max(created_at) from submission_events where submission_id = w.id and to_status = 'accepted')
     where p.username = $1 and w.status = 'accepted'
     order by e.created_at desc`,
    [username.trim().toLowerCase()],
  );
  const items: PublicContribution[] = rows.map((row) => {
    const evidence = row.public_evidence
      ? [
          ...asStrings(row.evidence_links).map((url, index) => ({ label: `Evidence ${index + 1}`, url })),
          ...(row.repo_url ? [{ label: "Repository", url: row.repo_url }] : []),
          ...(row.document_url ? [{ label: "Document", url: row.document_url }] : []),
        ]
      : null;
    return {
      id: row.id,
      title: row.title,
      projectName: row.project_name,
      opportunityTitle: row.opportunity_title,
      skills: asStrings(row.required_skills),
      acceptedAt: row.accepted_at,
      evidence,
    };
  });
  const skills = [...new Set(items.flatMap((item) => item.skills))];
  return {
    accepted: items.length,
    opportunities: new Set(rows.map((row) => row.opportunity_id)).size,
    skills,
    items,
  };
}
