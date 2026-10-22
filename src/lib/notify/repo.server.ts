import type { Sql } from "@/lib/db";

export type Notice = { id: string; kind: "application" | "submission" | "review" | "duel"; text: string; href: string; at: string };

const ISO = `'YYYY-MM-DD"T"HH24:MI:SS"Z"'`;
const label = (actor: string) => (actor.startsWith("chog:") ? `Chog #${actor.slice(5)}` : "A member");
const STATUS: Record<string, string> = {
  under_review: "is under review", shortlisted: "was shortlisted", accepted: "was accepted", rejected: "was declined",
  changes_requested: "needs changes",
};

/** In-app notices for one Chog, derived from existing events (nothing extra is stored). Newest first. */
export async function noticesFor(sql: Sql, actor: string, limit = 20): Promise<Notice[]> {
  const chogId = Number(actor.slice(5));
  const [apps, subs, appReviews, subReviews, duels] = await Promise.all([
    sql.query<{ id: string; who: string; title: string; at: string }>(
      `select a.id, a.contributor_wallet as who, o.title, to_char(a.created_at at time zone 'UTC', ${ISO}) as at
       from applications a join opportunities o on o.id = a.opportunity_id
       where o.owner_wallet = $1 and a.status <> 'withdrawn' order by a.created_at desc limit $2`, [actor, limit]),
    sql.query<{ id: string; who: string; title: string; at: string }>(
      `select w.id, w.contributor_wallet as who, o.title, to_char(e.created_at at time zone 'UTC', ${ISO}) as at
       from submission_events e join work_submissions w on w.id = e.submission_id join opportunities o on o.id = w.opportunity_id
       where o.owner_wallet = $1 and e.to_status = 'submitted' order by e.created_at desc limit $2`, [actor, limit]),
    sql.query<{ id: string; status: string; title: string; at: string }>(
      `select a.id, e.status, o.title, to_char(e.created_at at time zone 'UTC', ${ISO}) as at
       from application_events e join applications a on a.id = e.application_id join opportunities o on o.id = a.opportunity_id
       where a.contributor_wallet = $1 and e.status in ('under_review', 'shortlisted', 'accepted', 'rejected') order by e.created_at desc limit $2`, [actor, limit]),
    sql.query<{ id: string; status: string; title: string; at: string }>(
      `select w.id, e.to_status as status, o.title, to_char(e.created_at at time zone 'UTC', ${ISO}) as at
       from submission_events e join work_submissions w on w.id = e.submission_id join opportunities o on o.id = w.opportunity_id
       where w.contributor_wallet = $1 and e.to_status in ('under_review', 'accepted', 'rejected', 'changes_requested') order by e.created_at desc limit $2`, [actor, limit]),
    Number.isInteger(chogId)
      ? sql.query<{ id: string; challenger_id: number; outcome: string; at: string }>(
          `select id, challenger_id, outcome, to_char(created_at at time zone 'UTC', ${ISO}) as at
           from chog_duels where defender_id = $1 order by created_at desc limit $2`, [chogId, limit])
      : Promise.resolve([]),
  ]);
  const out: Notice[] = [
    ...apps.map((r) => ({ id: `a:${r.id}`, kind: "application" as const, text: `${label(r.who)} applied to ${r.title}`, href: `/applications/${r.id}`, at: r.at })),
    ...subs.map((r) => ({ id: `s:${r.id}:${r.at}`, kind: "submission" as const, text: `${label(r.who)} submitted work for ${r.title}`, href: `/submissions/${r.id}`, at: r.at })),
    ...appReviews.map((r) => ({ id: `ar:${r.id}:${r.status}`, kind: "review" as const, text: `Your application to ${r.title} ${STATUS[r.status] ?? r.status}`, href: `/applications/${r.id}`, at: r.at })),
    ...subReviews.map((r) => ({ id: `sr:${r.id}:${r.status}:${r.at}`, kind: "review" as const, text: `Your work for ${r.title} ${STATUS[r.status] ?? r.status}`, href: `/submissions/${r.id}`, at: r.at })),
    ...duels.map((r) => ({
      id: `d:${r.id}`, kind: "duel" as const,
      text: `Chog #${r.challenger_id} challenged you: ${r.outcome === "win" ? "you lost" : r.outcome === "loss" ? "you held" : "draw"}`,
      href: `/duel/${r.id}`, at: r.at,
    })),
  ];
  return out.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}
