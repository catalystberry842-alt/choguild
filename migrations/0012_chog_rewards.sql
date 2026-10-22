-- $CHOG rewards on listings. The publisher pays the accepted Chog's current holder straight from
-- their own wallet (plain ERC-20 transfer, no escrow). A payment is recorded only after the server
-- reads the receipt and finds the matching Transfer(from publisher, to holder, amount >= reward).
alter table opportunities add column if not exists reward_chog numeric(30, 4);
alter table opportunities drop constraint if exists opportunities_reward_chk;
alter table opportunities add constraint opportunities_reward_chk check (reward_chog is null or reward_chog > 0);

create table if not exists reward_payments (
  id text primary key,
  opportunity_id text not null references opportunities (id),
  target_kind text not null,
  target_id text not null,
  chog_id integer not null,
  payer_wallet text not null,
  payee_wallet text not null,
  amount_wei numeric(78, 0) not null,
  tx_hash text not null unique,
  created_at timestamptz not null default now(),
  constraint reward_payments_kind_chk check (target_kind in ('application', 'submission')),
  unique (opportunity_id, chog_id)
);
create index if not exists reward_payments_chog_idx on reward_payments (chog_id);
