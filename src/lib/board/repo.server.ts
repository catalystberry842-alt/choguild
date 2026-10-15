import type { Sql } from "@/lib/db";
import type { ApplicationListItem, ApplicationView, OpportunityCard, OpportunityDetail } from "@/lib/board/types";
import {
  APPLICATION_STATUSES,
  REVIEW_STATUSES,
  type ApplicationStatus,
  type ReviewStatus,
} from "@/lib/board/copy";
import { PAGE_SIZE, type BoardSearch } from "@/lib/board/search";
import {
  validateApplication,
  validateFeedback,
  validateOpportunity,
  type ApplicationInput,
  type BoardErrors,
  type OpportunityInput,
} from "@/lib/board/validate";

export type { ApplicationListItem, ApplicationView, OpportunityCard, OpportunityDetail };

type OppRow = {
  id: string;
  owner_wallet: string;
  project_name: string;
  project_logo_url: string | null;
  title: string;
  summary: string;
  description: string;
  scope: string;
  deliverables: string;
  required_skills: unknown;
  preferred_skills: unknown;
  category: string;
  compensation_type: string;
  compensation_details: string | null;
  time_commitment: string | null;
  deadline: string | null;
  instructions: string;
  question: string | null;
  positions: number | string | null;
  holders_only?: boolean | null;
  status: string;
  created_at: string;
  updated_at: string;
  my_status: string | null;
  my_application_id: string | null;
};

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

function accepting(row: { status: string; deadline: string | null }): boolean {
  if (row.status !== "open") return false;
  if (!row.deadline) return true;
  return new Date(row.deadline).getTime() > Date.now();
}

function toCard(row: OppRow, viewer: string | null): OpportunityCard {
  const mine = viewer != null && viewer === row.owner_wallet;
  const status = row.my_status && APPLICATION_STATUSES.includes(row.my_status as ApplicationStatus)
    ? (row.my_status as ApplicationStatus)
    : null;
  return {
    id: row.id,
    projectName: row.project_name,
    projectLogoUrl: row.project_logo_url,
    title: row.title,
    summary: row.summary,
    requiredSkills: asStrings(row.required_skills),
    category: row.category,
    compensationType: row.compensation_type,
    compensationDetails: row.compensation_details,
    deadline: row.deadline,
    status: row.status,
    accepting: accepting(row),
    myApplicationStatus: mine ? null : status,
    myApplicationId: mine ? null : row.my_application_id,
    createdAt: row.created_at,
    holdersOnly: row.holders_only === true,
  };
}

function toDetail(row: OppRow, viewer: string | null): OpportunityDetail {
  return {
    ...toCard(row, viewer),
    ownerWallet: row.owner_wallet,
    description: row.description,
    scope: row.scope,
    deliverables: row.deliverables,
    preferredSkills: asStrings(row.preferred_skills),
    timeCommitment: row.time_commitment,
    instructions: row.instructions,
    question: row.question,
    positions: row.positions == null ? null : Number(row.positions),
    updatedAt: row.updated_at,
    mine: viewer != null && viewer === row.owner_wallet,
  };
}

const CARD_COLUMNS = `
  o.id, o.owner_wallet, o.project_name, o.project_logo_url, o.title, o.summary, o.description,
  o.scope, o.deliverables, o.required_skills, o.preferred_skills, o.category, o.compensation_type,
  o.compensation_details, o.time_commitment,
  to_char(o.deadline at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as deadline,
  o.instructions, o.question, o.positions, o.holders_only, o.status,
  to_char(o.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
  to_char(o.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at,
  a.status as my_status,
  a.id as my_application_id
`;

function likeTerm(value: string): string {
  return `%${value.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
}

export async function listOpportunities(
  sql: Sql,
  search: BoardSearch,
  viewer: string | null,
): Promise<{ items: OpportunityCard[]; total: number; page: number; pageSize: number }> {
  const where: string[] = ["o.status <> 'draft'"];
  const params: unknown[] = [];
  const add = (value: unknown) => {
    params.push(value);
    return `$${params.length}`;
  };
  if (search.status !== "all") where.push(`o.status = ${add(search.status)}`);
  if (search.category !== "all") where.push(`o.category = ${add(search.category)}`);
  if (search.compensation !== "all") where.push(`o.compensation_type = ${add(search.compensation)}`);
  if (search.q) {
    const term = add(likeTerm(search.q));
    where.push(`(
      o.title ilike ${term} escape '\\' or o.project_name ilike ${term} escape '\\'
      or o.summary ilike ${term} escape '\\' or o.description ilike ${term} escape '\\'
      or exists (
        select 1 from jsonb_array_elements_text(o.required_skills) skill
        where skill ilike ${term} escape '\\'
      )
    )`);
  }
  if (search.skills.length > 0) {
    const holder = add(search.skills.map((skill) => skill.toLowerCase()));
    where.push(`exists (
      select 1 from jsonb_array_elements_text(o.required_skills) skill
      where lower(skill) = any(${holder}::text[])
    )`);
  }
  const viewerHolder = add(viewer ?? "");
  const whereSql = where.join(" and ");
  const order =
    search.sort === "title"
      ? "lower(o.title) asc"
      : search.sort === "closing"
        ? "o.deadline asc nulls last, o.created_at desc"
        : "o.created_at desc";
  const countRows = await sql.query<{ count: number | string }>(
    `select count(*)::int as count from opportunities o where ${whereSql}`,
    params.slice(0, params.length - 1),
  );
  const total = Number(countRows[0]?.count ?? 0);
  const pageSize = PAGE_SIZE;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(search.page, pages);
  const offset = (page - 1) * pageSize;
  const limit = add(pageSize);
  const offsetHolder = add(offset);
  const rows = await sql.query<OppRow>(
    `select ${CARD_COLUMNS}
     from opportunities o
     left join applications a on a.opportunity_id = o.id and a.contributor_wallet = ${viewerHolder}
     where ${whereSql}
     order by ${order}
     limit ${limit} offset ${offsetHolder}`,
    params,
  );
  return { items: rows.map((row) => toCard(row, viewer)), total, page, pageSize };
}

export async function listOwnedOpportunities(sql: Sql, owner: string): Promise<OpportunityCard[]> {
  const rows = await sql.query<OppRow>(
    `select ${CARD_COLUMNS}
     from opportunities o
     left join applications a on false
     where o.owner_wallet = $1
     order by o.updated_at desc`,
    [owner],
  );
  return rows.map((row) => toCard(row, owner));
}

export async function getOpportunity(sql: Sql, id: string, viewer: string | null): Promise<OpportunityDetail | null> {
  const rows = await sql.query<OppRow>(
    `select ${CARD_COLUMNS}
     from opportunities o
     left join applications a on a.opportunity_id = o.id and a.contributor_wallet = $2
     where o.id = $1`,
    [id, viewer ?? ""],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.status === "draft" && row.owner_wallet !== viewer) return null;
  return toDetail(row, viewer);
}

async function readDetail(sql: Sql, id: string, viewer: string): Promise<OpportunityDetail | null> {
  return getOpportunity(sql, id, viewer);
}

export async function createOpportunity(
  sql: Sql,
  owner: string,
  input: OpportunityInput,
): Promise<{ ok: true; opportunity: OpportunityDetail } | { ok: false; error: string; fieldErrors?: BoardErrors }> {
  const parsed = validateOpportunity(input);
  if (!parsed.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.errors };
  const value = parsed.value;
  const id = crypto.randomUUID();
  await sql.query(
    `insert into opportunities (
      id, owner_wallet, project_name, project_logo_url, title, summary, description, scope, deliverables,
      required_skills, preferred_skills, category, compensation_type, compensation_details, time_commitment,
      deadline, instructions, question, positions, status, holders_only
    ) values (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
    )`,
    [
      id, owner, value.projectName, value.projectLogoUrl, value.title, value.summary, value.description,
      value.scope, value.deliverables, JSON.stringify(value.requiredSkills), JSON.stringify(value.preferredSkills),
      value.category, value.compensationType, value.compensationDetails, value.timeCommitment, value.deadline,
      value.instructions, value.question, value.positions, value.status, value.holdersOnly,
    ],
  );
  const opportunity = await readDetail(sql, id, owner);
  if (!opportunity) return { ok: false, error: "The opportunity was saved but could not be read back." };
  return { ok: true, opportunity };
}

export async function updateOpportunity(
  sql: Sql,
  owner: string,
  id: string,
  input: OpportunityInput,
): Promise<{ ok: true; opportunity: OpportunityDetail } | { ok: false; error: string; fieldErrors?: BoardErrors }> {
  const current = await readDetail(sql, id, owner);
  if (!current || !current.mine) return { ok: false, error: "You can only edit an opportunity you published." };
  const parsed = validateOpportunity(input);
  if (!parsed.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.errors };
  const value = parsed.value;
  const status = current.status === "filled" || current.status === "closed" ? current.status : value.status;
  const updated = await sql.query<{ id: string }>(
    `update opportunities set
      project_name = $3, project_logo_url = $4, title = $5, summary = $6, description = $7, scope = $8,
      deliverables = $9, required_skills = $10::jsonb, preferred_skills = $11::jsonb, category = $12,
      compensation_type = $13, compensation_details = $14, time_commitment = $15, deadline = $16,
      instructions = $17, question = $18, positions = $19, status = $20, holders_only = $21, updated_at = now()
     where id = $1 and owner_wallet = $2
     returning id`,
    [
      id, owner, value.projectName, value.projectLogoUrl, value.title, value.summary, value.description,
      value.scope, value.deliverables, JSON.stringify(value.requiredSkills), JSON.stringify(value.preferredSkills),
      value.category, value.compensationType, value.compensationDetails, value.timeCommitment, value.deadline,
      value.instructions, value.question, value.positions, status, value.holdersOnly,
    ],
  );
  if (!updated[0]) return { ok: false, error: "You can only edit an opportunity you published." };
  const opportunity = await readDetail(sql, id, owner);
  if (!opportunity) return { ok: false, error: "The opportunity was saved but could not be read back." };
  return { ok: true, opportunity };
}

export async function setOpportunityStatus(
  sql: Sql,
  owner: string,
  id: string,
  status: "open" | "closed" | "filled",
): Promise<{ ok: true; opportunity: OpportunityDetail } | { ok: false; error: string }> {
  const updated = await sql.query<{ id: string }>(
    `update opportunities set status = $3, updated_at = now()
     where id = $1 and owner_wallet = $2 and status <> 'draft'
     returning id`,
    [id, owner, status],
  );
  if (!updated[0]) return { ok: false, error: "You can only change the status of an opportunity you published." };
  const opportunity = await readDetail(sql, id, owner);
  if (!opportunity) return { ok: false, error: "The opportunity could not be read back." };
  return { ok: true, opportunity };
}

function closedReason(row: { status: string; deadline: string | null; owner_wallet: string }, wallet: string): string | null {
  if (row.owner_wallet === wallet) return "You cannot apply to an opportunity you published.";
  if (row.status === "closed") return "Applications are closed.";
  if (row.status === "filled") return "This opportunity is filled.";
  if (row.status !== "open") return "This opportunity is not accepting applications.";
  if (row.deadline && new Date(row.deadline).getTime() <= Date.now()) return "The application deadline has passed.";
  return null;
}

export async function applyToOpportunity(
  sql: Sql,
  wallet: string,
  opportunityId: string,
  input: ApplicationInput,
  /** Live Chog Genesis check for gated listings: true/false, or null when the chain can't be read. */
  isChogHolder: (wallet: string) => Promise<boolean | null> = async () => null,
): Promise<{ ok: true; applicationId: string } | { ok: false; error: string; fieldErrors?: BoardErrors }> {
  const parsed = validateApplication(input);
  if (!parsed.ok) return { ok: false, error: "Check the highlighted fields.", fieldErrors: parsed.errors };
  const rows = await sql<{ owner_wallet: string; status: string; deadline: string | null; holders_only: boolean | null }>`
    select owner_wallet, status, holders_only,
      to_char(deadline at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as deadline
    from opportunities where id = ${opportunityId}
  `;
  const opportunity = rows[0];
  if (!opportunity) return { ok: false, error: "That opportunity does not exist." };
  const reason = closedReason(opportunity, wallet);
  if (reason) return { ok: false, error: reason };
  if (opportunity.holders_only === true) {
    const holder = await isChogHolder(wallet);
    if (holder === null) return { ok: false, error: "Chog holdings could not be checked on Monad right now. Try again in a minute." };
    if (!holder) return { ok: false, error: "This listing is open to Chog Genesis holders only." };
  }
  const existing = await sql<{ id: string; status: string }>`
    select id, status from applications
    where opportunity_id = ${opportunityId} and contributor_wallet = ${wallet}
  `;
  const value = parsed.value;
  if (existing[0] && existing[0].status !== "withdrawn") {
    return { ok: false, error: "You already have an application for this opportunity." };
  }
  const id = existing[0]?.id ?? crypto.randomUUID();
  if (existing[0]) {
    await sql.query(
      `update applications set
        introduction = $2, suitability = $3, experience = $4, links = $5::jsonb, extra_answer = $6,
        status = 'submitted', feedback = null, updated_at = now()
       where id = $1 and status = 'withdrawn'`,
      [id, value.introduction, value.suitability, value.experience, JSON.stringify(value.links), value.extraAnswer],
    );
  } else {
    try {
      await sql.query(
        `insert into applications (
          id, opportunity_id, contributor_wallet, introduction, suitability, experience, links, extra_answer, status
        ) values ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,'submitted')`,
        [id, opportunityId, wallet, value.introduction, value.suitability, value.experience, JSON.stringify(value.links), value.extraAnswer],
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.toLowerCase().includes("applications_one_per_contributor")) {
        return { ok: false, error: "You already have an application for this opportunity." };
      }
      throw error;
    }
  }
  await sql.query(`insert into application_events (id, application_id, status) values ($1,$2,'submitted')`, [
    crypto.randomUUID(),
    id,
  ]);
  return { ok: true, applicationId: id };
}

export async function withdrawApplication(
  sql: Sql,
  wallet: string,
  applicationId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const updated = await sql.query<{ id: string }>(
    `update applications set status = 'withdrawn', updated_at = now()
     where id = $1 and contributor_wallet = $2 and status in ('submitted', 'under_review', 'shortlisted')
     returning id`,
    [applicationId, wallet],
  );
  if (!updated[0]) return { ok: false, error: "This application cannot be withdrawn." };
  await sql.query(`insert into application_events (id, application_id, status) values ($1,$2,'withdrawn')`, [
    crypto.randomUUID(),
    applicationId,
  ]);
  return { ok: true };
}

export async function setApplicationStatus(
  sql: Sql,
  owner: string,
  applicationId: string,
  status: ReviewStatus,
  feedback: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!REVIEW_STATUSES.includes(status)) return { ok: false, error: "Choose a review status." };
  const note = validateFeedback(feedback);
  if (!note.ok) return { ok: false, error: note.error };
  const updated = await sql.query<{ id: string }>(
    `update applications a set status = $3, feedback = $4, updated_at = now()
     from opportunities o
     where a.id = $1 and a.opportunity_id = o.id and o.owner_wallet = $2
       and a.contributor_wallet <> $2 and a.status <> 'withdrawn'
     returning a.id`,
    [applicationId, owner, status, note.feedback],
  );
  if (!updated[0]) return { ok: false, error: "You can only review applications for opportunities you published." };
  await sql.query(`insert into application_events (id, application_id, status) values ($1,$2,$3)`, [
    crypto.randomUUID(),
    applicationId,
    status,
  ]);
  return { ok: true };
}

type AppRow = {
  id: string;
  opportunity_id: string;
  contributor_wallet: string;
  introduction: string;
  suitability: string;
  experience: string | null;
  links: unknown;
  extra_answer: string | null;
  status: ApplicationStatus;
  feedback: string | null;
  created_at: string;
  updated_at: string;
  title: string;
  project_name: string;
  owner_wallet: string;
  username: string | null;
  display_name: string | null;
  skills: unknown;
};

async function history(sql: Sql, applicationId: string) {
  const rows = await sql.query<{ status: string; created_at: string }>(
    `select status, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
     from application_events where application_id = $1 order by created_at asc`,
    [applicationId],
  );
  return rows.map((row) => ({ status: row.status, createdAt: row.created_at }));
}

function toApplication(row: AppRow, viewer: "contributor" | "creator", events: { status: string; createdAt: string }[]): ApplicationView {
  return {
    id: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.title,
    projectName: row.project_name,
    introduction: row.introduction,
    suitability: row.suitability,
    experience: row.experience,
    links: asStrings(row.links),
    extraAnswer: row.extra_answer,
    status: row.status,
    feedback: row.feedback,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    username: row.username,
    displayName: row.display_name,
    skills: asStrings(row.skills),
    viewer,
    history: events,
  };
}

const APP_SELECT = `
  a.id, a.opportunity_id, a.contributor_wallet, a.introduction, a.suitability, a.experience, a.links,
  a.extra_answer, a.status, a.feedback,
  to_char(a.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at,
  to_char(a.updated_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as updated_at,
  o.title, o.project_name, o.owner_wallet,
  p.username, p.display_name, p.skills
`;

export async function getApplication(sql: Sql, wallet: string, applicationId: string): Promise<ApplicationView | null> {
  const rows = await sql.query<AppRow>(
    `select ${APP_SELECT}
     from applications a
     join opportunities o on o.id = a.opportunity_id
     left join contributor_profiles p on p.wallet_address = a.contributor_wallet
     where a.id = $1`,
    [applicationId],
  );
  const row = rows[0];
  if (!row) return null;
  const viewer = row.contributor_wallet === wallet ? "contributor" : row.owner_wallet === wallet ? "creator" : null;
  if (!viewer) return null;
  return toApplication(row, viewer, await history(sql, row.id));
}

export async function listMyApplications(sql: Sql, wallet: string): Promise<ApplicationListItem[]> {
  const rows = await sql.query<{
    id: string;
    opportunity_id: string;
    title: string;
    project_name: string;
    status: ApplicationStatus;
    created_at: string;
    feedback: string | null;
  }>(
    `select a.id, a.opportunity_id, o.title, o.project_name, a.status, a.feedback,
      to_char(a.created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
     from applications a
     join opportunities o on o.id = a.opportunity_id
     where a.contributor_wallet = $1
     order by a.created_at desc`,
    [wallet],
  );
  return rows.map((row) => ({
    id: row.id,
    opportunityId: row.opportunity_id,
    opportunityTitle: row.title,
    projectName: row.project_name,
    status: row.status,
    createdAt: row.created_at,
    feedback: row.feedback,
  }));
}

export async function listOpportunityApplications(
  sql: Sql,
  owner: string,
  opportunityId: string,
): Promise<{ ok: true; title: string; items: ApplicationView[] } | { ok: false; error: string }> {
  const owned = await sql.query<{ title: string }>(
    `select title from opportunities where id = $1 and owner_wallet = $2`,
    [opportunityId, owner],
  );
  if (!owned[0]) return { ok: false, error: "You can only review applications for opportunities you published." };
  const rows = await sql.query<AppRow>(
    `select ${APP_SELECT}
     from applications a
     join opportunities o on o.id = a.opportunity_id
     left join contributor_profiles p on p.wallet_address = a.contributor_wallet
     where a.opportunity_id = $1
     order by a.created_at desc`,
    [opportunityId],
  );
  const items = await Promise.all(rows.map(async (row) => toApplication(row, "creator", await history(sql, row.id))));
  return { ok: true, title: owned[0].title, items };
}
