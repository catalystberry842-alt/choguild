import assert from "node:assert/strict";
import { test } from "node:test";
import { freshDb } from "../testing/pg.ts";
import { noticesFor } from "./repo.server.ts";

test("notices: applications to my listing, my reviews, duels against me; orphaned wallet listings are closed and kept", async () => {
  const { sql } = await freshDb();
  const opp = (id: string, owner: string) => sql.query(
    `insert into opportunities (id, owner_wallet, project_name, title, summary, description, scope, deliverables, category, compensation_type, instructions, status)
     values ($1,$2,'P','Title ' || $1,'s','d','s','d','content','unpaid','i','open')`, [id, owner]);
  await opp("o1", "chog:5");
  await sql.query(`insert into applications (id, opportunity_id, contributor_wallet, introduction, suitability, status) values ('a1','o1','chog:9','hi','fit','accepted')`);
  await sql.query(`insert into application_events (id, application_id, status, created_at) values ('e1','a1','accepted', now() + interval '1 minute')`);
  await sql.query(`insert into chog_duels (id, challenger_id, defender_id, challenger_wallet, defender_wallet, day, challenger_picks, defender_picks, challenger_level, defender_level, challenger_score, defender_score, outcome, challenger_xp, defender_xp)
    values ('d1', 9, 5, '0x9', '0x5', current_date, 'CGT', 'TTT', 0, 0, 1, 1, 'draw', 3, 0)`);
  const mine = await noticesFor(sql as never, "chog:5");
  assert.deepEqual(mine.map((n) => n.kind).sort(), ["application", "duel"]);
  assert.match(mine.find((n) => n.kind === "application")!.text, /Chog #9 applied/);
  const theirs = await noticesFor(sql as never, "chog:9");
  assert.equal(theirs[0].kind, "review");
  assert.match(theirs[0].text, /was accepted/);

  await opp("o2", "0xdeadbeef00000000000000000000000000000000");
  const { readFileSync } = await import("node:fs");
  await (sql as unknown as { query: (t: string) => Promise<unknown> }).query(readFileSync(new URL("../../../migrations/0013_orphan_listings.sql", import.meta.url), "utf8").split(";\n")[1]);
  const rows = await sql.query<{ id: string; status: string; orphaned: boolean }>(`select id, status, orphaned_at is not null as orphaned from opportunities order by id`);
  assert.deepEqual(rows, [{ id: "o1", status: "open", orphaned: false }, { id: "o2", status: "closed", orphaned: true }]);
});
