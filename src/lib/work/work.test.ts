import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import { createWork, getWork, publicContributions, reviewWork, updateDraft } from "./repo.server.ts";
import { validateWork } from "./validate.ts";
import { withTransaction } from "../tx.ts";
import { listContributors } from "../ranking/repo.server.ts";

type Sql = {
  <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]>;
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
};

const OWNER = "0x1111111111111111111111111111111111111111";
const OTHER = "0x2222222222222222222222222222222222222222";

function toSql(pg: PGlite): Sql {
  const sql = (async <T = Record<string, unknown>>(strings: TemplateStringsArray, ...values: unknown[]): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let index = 0; index < values.length; index += 1) text += `$${index + 1}${strings[index + 1] ?? ""}`;
    return (await pg.query<T>(text, values)).rows;
  }) as unknown as Sql;
  sql.query = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) => (await pg.query<T>(text, params)).rows;
  (sql as Sql & { transaction?: unknown }).transaction = <R>(fn: (tx: Sql) => Promise<R>) =>
    pg.transaction((tx) => fn(toSql(tx as unknown as PGlite)));
  return sql;
}

const work = {
  title: "Onboarding note",
  description: "The note explains how a contributor passport is used.",
  evidenceLinks: ["https://example.com/note"],
  repoUrl: "",
  documentUrl: "",
  notes: "",
  publicEvidence: true,
  submit: true,
};

describe("work proof", () => {
  let sql: Sql;
  let applicationId = "";

  before(async () => {
    const pg = new PGlite();
    sql = toSql(pg);
    for (const file of ["0002_passport.sql", "0003_board.sql", "0004_work.sql", "0005_indexes.sql", "0006_remove_demo_data.sql", "0007_chog_gate.sql", "0008_audit_v15.sql"]) {
      await pg.exec(readFileSync(new URL(`../../../migrations/${file}`, import.meta.url), "utf8"));
    }
    await sql.query(
      `insert into opportunities (id, owner_wallet, project_name, title, summary, description, scope, deliverables, required_skills, preferred_skills, category, compensation_type, instructions, status)
       values ('opp-1',$1,'Field Desk','Write the note','A summary long enough for the board.','A description long enough to be stored as a real opportunity.','Scope of the note.','One markdown note.','["Content writing"]'::jsonb,'[]'::jsonb,'content','unpaid','Send the note.','open')`,
      [OWNER],
    );
    await sql.query(
      `insert into contributor_profiles (id, username, display_name, biography, skills, other_links, wallet_address, visibility)
       values ('profile-1','ada_lane','Ada Lane','I write notes for contributors.', '["Content writing"]'::jsonb, '[]'::jsonb, $1, 'public')`,
      [OTHER],
    );
    applicationId = "app-1";
    await sql.query(
      `insert into applications (id, opportunity_id, contributor_wallet, introduction, suitability, links, status)
       values ($1,'opp-1',$2,'I write notes for contributor programs.','I can match this scope.','[]'::jsonb,'accepted')`,
      [applicationId, OTHER],
    );
  });

  it("rejects a submission without an https evidence link", () => {
    const result = validateWork({ ...work, evidenceLinks: ["http://example.com/note"], submit: true });
    assert.equal(result.ok, false);
  });

  it("requires an accepted application and blocks self-approval", async () => {
    const denied = await createWork(sql, OTHER, "missing", work);
    assert.equal(denied.ok, false);
    const own = await createWork(sql, OWNER, applicationId, work);
    assert.equal(own.ok, false);
    const created = await createWork(sql, OTHER, applicationId, work);
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const duplicate = await createWork(sql, OTHER, applicationId, work);
    assert.equal(duplicate.ok, false);
    const outsider = await getWork(sql, "0x3333333333333333333333333333333333333333", created.work.id);
    assert.equal(outsider, null);
    const self = await reviewWork(sql, OTHER, created.work.id, "accepted", "I approve myself", "");
    assert.equal(self.ok, false);
    const changes = await reviewWork(sql, OWNER, created.work.id, "changes_requested", "Please tighten the opening.", "internal only");
    assert.equal(changes.ok, true);
    if (!changes.ok) return;
    const contributorView = await getWork(sql, OTHER, created.work.id);
    assert.equal(contributorView?.history.some((event) => event.comment === "Please tighten the opening."), true);
    assert.equal(contributorView?.history.some((event) => event.privateNote), false);
    const revised = await updateDraft(sql, OTHER, created.work.id, { ...work, title: "Onboarding note revised", description: "The revised note has a tighter opening paragraph." });
    assert.equal(revised.ok, true);
    if (!revised.ok) return;
    assert.equal(revised.work.versions.length, 2);
    assert.equal(revised.work.versions[0]?.title, "Onboarding note");
    const accepted = await reviewWork(sql, OWNER, created.work.id, "accepted", "Accepted.", "");
    assert.equal(accepted.ok, true);
    const summary = await publicContributions(sql, "ada_lane");
    assert.equal(summary.accepted, 1);
    assert.equal(summary.items[0]?.evidence?.[0]?.url, "https://example.com/note");
    const rejected = await createWork(sql, OTHER, applicationId, work);
    assert.equal(rejected.ok, false);
  });

  it("rolls back every statement of a failed transaction", async () => {
    await assert.rejects(
      withTransaction(sql, async (tx) => {
        await tx.query(`insert into submission_events (id, submission_id, actor_wallet, from_status, to_status) values ('tx-test', 'missing', $1, null, 'draft')`, [OWNER]);
        throw new Error("boom");
      }),
    );
    const rows = await sql.query(`select id from submission_events where id = 'tx-test'`);
    assert.equal(rows.length, 0);
  });

  it("ranking ignores publish+close loops and credits real accepted work", async () => {
    for (let i = 0; i < 10; i += 1) {
      await sql.query(
        `insert into opportunities (id, owner_wallet, project_name, title, summary, description, scope, deliverables, required_skills, preferred_skills, category, compensation_type, instructions, status, published_at, closed_at)
         values ($2,$1,'Farm','Farm listing','A summary long enough for the board.','A description long enough to be stored as a real opportunity.','Scope.','None.','[]'::jsonb,'[]'::jsonb,'content','unpaid','None.','closed', now() - interval '1 minute', now())`,
        [OTHER, `farm-${i}`],
      );
    }
    const people = await listContributors(sql);
    const ada = people.find((person) => person.username === "ada_lane");
    assert.ok(ada);
    assert.equal(ada.counts.publishedOpportunities, 0);
    assert.equal(ada.counts.acceptedSubmissions, 1);
    assert.equal(ada.guildXp, 10 + 100 + 25);
  });
});
