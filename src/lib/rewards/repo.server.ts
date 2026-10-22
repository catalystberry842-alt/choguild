import { randomUUID } from "node:crypto";
import type { Sql } from "@/lib/db";
import { formatChog } from "./rewards";

export type RewardTarget = {
  kind: "application" | "submission";
  id: string;
  opportunityId: string;
  opportunityTitle: string;
  ownerActor: string;
  contributorActor: string;
  chogId: number | null;
  status: string;
  reward: string | null;
};

export type RewardPayment = { txHash: string; amount: string; payee: string; paidAt: string };

export async function loadTarget(sql: Sql, kind: RewardTarget["kind"], id: string): Promise<RewardTarget | null> {
  const table = kind === "application" ? "applications" : "work_submissions";
  const rows = await sql.query<{ id: string; opportunity_id: string; title: string; owner_wallet: string; contributor_wallet: string; status: string; reward: string | null }>(
    `select t.id, t.opportunity_id, o.title, o.owner_wallet, t.contributor_wallet, t.status, o.reward_chog::text as reward
     from ${table} t join opportunities o on o.id = t.opportunity_id where t.id = $1`,
    [id],
  );
  const r = rows[0];
  if (!r) return null;
  const chog = /^chog:(\d+)$/.exec(r.contributor_wallet);
  return {
    kind, id: r.id, opportunityId: r.opportunity_id, opportunityTitle: r.title, ownerActor: r.owner_wallet,
    contributorActor: r.contributor_wallet, chogId: chog ? Number(chog[1]) : null, status: r.status,
    reward: r.reward == null ? null : String(Number(r.reward)),
  };
}

export async function paymentFor(sql: Sql, opportunityId: string, chogId: number): Promise<RewardPayment | null> {
  const rows = await sql<{ tx_hash: string; amount_wei: string; payee_wallet: string; paid_at: string }>`
    select tx_hash, amount_wei::text as amount_wei, payee_wallet, to_char(created_at at time zone 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as paid_at
    from reward_payments where opportunity_id = ${opportunityId} and chog_id = ${chogId}`;
  const r = rows[0];
  return r ? { txHash: r.tx_hash, amount: formatChog(r.amount_wei), payee: r.payee_wallet, paidAt: r.paid_at } : null;
}

export async function insertPayment(
  sql: Sql,
  p: { target: RewardTarget; chogId: number; payer: string; payee: string; amountWei: bigint; txHash: string },
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await sql`insert into reward_payments (id, opportunity_id, target_kind, target_id, chog_id, payer_wallet, payee_wallet, amount_wei, tx_hash)
      values (${randomUUID()}, ${p.target.opportunityId}, ${p.target.kind}, ${p.target.id}, ${p.chogId}, ${p.payer}, ${p.payee}, ${p.amountWei.toString()}::numeric, ${p.txHash})`;
    return { ok: true };
  } catch {
    return { ok: false, error: "This reward or transaction is already recorded." };
  }
}

/** $CHOG paid to each Chog's holders through listing rewards (whole tokens, as display strings). */
export async function paidTotal(sql: Sql, chogId: number): Promise<{ total: string; count: number }> {
  const rows = await sql<{ total: string | null; n: unknown }>`select sum(amount_wei)::text as total, count(*) as n from reward_payments where chog_id = ${chogId}`;
  return { total: formatChog(rows[0]?.total ?? "0"), count: Number(rows[0]?.n ?? 0) };
}
