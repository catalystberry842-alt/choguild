import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { before, describe, it } from "node:test";
import { PGlite } from "@electric-sql/pglite";
import {
  applyToOpportunity,
  createOpportunity,
  getApplication,
  getOpportunity,
  listOpportunities,
  setApplicationStatus,
  setOpportunityStatus,
  updateOpportunity,
  withdrawApplication,
} from "./repo.server.ts";
import { emptyBoardSearch } from "./search.ts";
import { validateOpportunity, type OpportunityInput } from "./validate.ts";

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
    const result = await pg.query<T>(text, values);
    return result.rows;
  }) as unknown as Sql;
  sql.query = async <T = Record<string, unknown>>(text: string, params: unknown[] = []) => {
    const result = await pg.query<T>(text, params);
    return result.rows;
  };
  (sql as Sql & { transaction?: unknown }).transaction = <R>(fn: (tx: Sql) => Promise<R>) =>
    pg.transaction((tx) => fn(toSql(tx as unknown as PGlite)));
  return sql;
}

function input(overrides: Partial<OpportunityInput> = {}): OpportunityInput {
  return {
    projectName: "Field Desk",
    projectLogoUrl: "",
    title: "Write the onboarding note",
    summary: "A real summary that is long enough to publish on the board.",
    description: "A full description of the work that a contributor would actually read before applying.",
    scope: "One note, one review, and a clear stop.",
    deliverables: "A markdown note of about 600 words.",
    requiredSkills: ["Content writing"],
    preferredSkills: [],
    category: "content",
    compensationType: "unpaid",
    compensationDetails: "",
    timeCommitment: "6 hours",
    deadline: "",
    instructions: "Send the note in the application.",
    question: "",
    positions: "1",
    publish: true,
    ...overrides,
  };
}

describe("opportunity validation", () => {
  it("rejects a short title, a past deadline, and paid work with no terms", () => {
    const yesterday = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const result = validateOpportunity(input({ title: "No", deadline: yesterday, compensationType: "paid", compensationDetails: "" }));
    assert.equal(result.ok, false);
    if (result.ok) return;
    assert.ok(result.errors.title);
    assert.ok(result.errors.deadline);
    assert.ok(result.errors.compensationDetails);
  });
});

describe("collaboration board", () => {
  let sql: Sql;

  before(async () => {
    const pg = new PGlite();
    sql = toSql(pg);
    await pg.exec(readFileSync(new URL("../../../migrations/0002_passport.sql", import.meta.url), "utf8"));
    await pg.exec(readFileSync(new URL("../../../migrations/0003_board.sql", import.meta.url), "utf8"));
    await pg.exec(readFileSync(new URL("../../../migrations/0004_work.sql", import.meta.url), "utf8"));
    await pg.exec(readFileSync(new URL("../../../migrations/0005_indexes.sql", import.meta.url), "utf8"));
    await pg.exec(readFileSync(new URL("../../../migrations/0006_remove_demo_data.sql", import.meta.url), "utf8"));
    await pg.exec(readFileSync(new URL("../../../migrations/0007_chog_gate.sql", import.meta.url), "utf8"));
    await pg.exec(readFileSync(new URL("../../../migrations/0008_audit_v15.sql", import.meta.url), "utf8"));
  });

  it("publishes, hides drafts, and blocks edits from another wallet", async () => {
    const created = await createOpportunity(sql, OWNER, input());
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const draft = await createOpportunity(sql, OWNER, input({ title: "Hidden draft title", publish: false }));
    assert.equal(draft.ok, true);
    const listed = await listOpportunities(sql, emptyBoardSearch(), null);
    assert.ok(listed.items.some((item) => item.id === created.opportunity.id));
    assert.equal(listed.items.some((item) => item.title === "Hidden draft title"), false);
    const stolen = await updateOpportunity(sql, OTHER, created.opportunity.id, input({ title: "Stolen title" }));
    assert.equal(stolen.ok, false);
    const same = await getOpportunity(sql, created.opportunity.id, OTHER);
    assert.equal(same?.title, "Write the onboarding note");
  });

  it("searches and filters the real rows", async () => {
    const found = await listOpportunities(sql, { ...emptyBoardSearch(), q: "onboarding", status: "all" }, null);
    assert.ok(found.items.some((item) => item.title === "Write the onboarding note"));
    const missed = await listOpportunities(sql, { ...emptyBoardSearch(), q: "zzzz-no-match", status: "all" }, null);
    assert.equal(missed.total, 0);
    const design = await listOpportunities(sql, { ...emptyBoardSearch(), category: "design", status: "all" }, null);
    assert.ok(design.items.every((item) => item.category === "design"));
    assert.equal(await getOpportunity(sql, "missing-id", null), null);
  });

  it("enforces application rules on the server", async () => {
    const created = await createOpportunity(sql, OWNER, input({ title: "Open research desk" }));
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const id = created.opportunity.id;
    const own = await applyToOpportunity(sql, OWNER, id, application());
    assert.equal(own.ok, false);
    const missing = await applyToOpportunity(sql, OTHER, "missing-id", application());
    assert.equal(missing.ok, false);
    const sent = await applyToOpportunity(sql, OTHER, id, application());
    assert.equal(sent.ok, true);
    if (!sent.ok) return;
    const duplicate = await applyToOpportunity(sql, OTHER, id, application());
    assert.equal(duplicate.ok, false);
    const stranger = await getApplication(sql, OWNER, sent.applicationId);
    assert.equal(stranger?.viewer, "creator");
    const outsider = await getApplication(sql, "0x3333333333333333333333333333333333333333", sent.applicationId);
    assert.equal(outsider, null);
    const selfReview = await setApplicationStatus(sql, OTHER, sent.applicationId, "accepted", "");
    assert.equal(selfReview.ok, false);
    const reviewed = await setApplicationStatus(sql, OWNER, sent.applicationId, "shortlisted", "Worth a look");
    assert.equal(reviewed.ok, true);
    const closed = await setOpportunityStatus(sql, OWNER, id, "closed");
    assert.equal(closed.ok, true);
    const afterClose = await applyToOpportunity(sql, "0x4444444444444444444444444444444444444444", id, application());
    assert.equal(afterClose.ok, false);

    const tomorrow = new Date(Date.now() + 86_400_000).toISOString().slice(0, 10);
    const expiring = await createOpportunity(sql, OWNER, input({ title: "Already expired desk", deadline: tomorrow }));
    assert.equal(expiring.ok, true);
    if (!expiring.ok) return;
    await sql.query(`update opportunities set deadline = now() - interval '1 day' where id = $1`, [expiring.opportunity.id]);
    const late = await applyToOpportunity(sql, "0x4444444444444444444444444444444444444444", expiring.opportunity.id, application());
    assert.equal(late.ok, false);
  });

  it("lets the contributor withdraw and keeps the single row", async () => {
    const created = await createOpportunity(sql, OWNER, input({ title: "Withdraw desk" }));
    assert.equal(created.ok, true);
    if (!created.ok) return;
    const sent = await applyToOpportunity(sql, OTHER, created.opportunity.id, application());
    assert.equal(sent.ok, true);
    if (!sent.ok) return;
    const pulled = await withdrawApplication(sql, OTHER, sent.applicationId);
    assert.equal(pulled.ok, true);
    const again = await applyToOpportunity(sql, OTHER, created.opportunity.id, application());
    assert.equal(again.ok, true);
    if (!again.ok) return;
    assert.equal(again.applicationId, sent.applicationId);
  });

  it("enforces the Chog holders-only gate on apply", async () => {
    const created = await createOpportunity(sql, OWNER, input({ title: "Holders only listing", holdersOnly: true }));
    assert.equal(created.ok, true);
    if (!created.ok) return;
    assert.equal(created.opportunity.holdersOnly, true);
    const id = created.opportunity.id;
    const A = "0x5555555555555555555555555555555555555555";
    const B = "0x6666666666666666666666666666666666666666";
    const notHolder = await applyToOpportunity(sql, A, id, application(), async () => false);
    assert.equal(notHolder.ok, false);
    if (!notHolder.ok) assert.match(notHolder.error, /holders only/);
    const unknown = await applyToOpportunity(sql, A, id, application(), async () => null);
    assert.equal(unknown.ok, false);
    if (!unknown.ok) assert.match(unknown.error, /could not be checked/);
    const holder = await applyToOpportunity(sql, B, id, application(), async () => true);
    assert.equal(holder.ok, true);
    // Ungated listings never call the checker.
    const open = await createOpportunity(sql, OWNER, input({ title: "Open to everyone listing" }));
    assert.equal(open.ok, true);
    if (!open.ok) return;
    assert.equal(open.opportunity.holdersOnly, false);
    const anyone = await applyToOpportunity(sql, A, open.opportunity.id, application(), async () => {
      throw new Error("should not be called");
    });
    assert.equal(anyone.ok, true);
  });
});

function application() {
  return {
    introduction: "I write notes for contributor programs.",
    suitability: "I have published similar notes and can match the scope.",
    experience: "Research",
    links: ["https://example.com/note"],
    extraAnswer: "",
  };
}
