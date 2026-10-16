-- v15 audit: lowercase wallets on write, anti-farming timestamps, nonce rate-limit
-- columns, and persisted onchain caches so first visits never wait on the RPC.

update contributor_profiles set wallet_address = lower(wallet_address) where wallet_address <> lower(wallet_address);
update opportunities set owner_wallet = lower(owner_wallet) where owner_wallet <> lower(owner_wallet);
update applications set contributor_wallet = lower(contributor_wallet) where contributor_wallet <> lower(contributor_wallet);
update work_submissions set contributor_wallet = lower(contributor_wallet) where contributor_wallet <> lower(contributor_wallet);
update submission_events set actor_wallet = lower(actor_wallet) where actor_wallet <> lower(actor_wallet);
update passport_nonces set address = lower(address) where address <> lower(address);
update passport_sessions set address = lower(address) where address <> lower(address);

-- When a listing left the open state (closed/filled); null while open or draft.
alter table opportunities add column if not exists published_at timestamptz;
alter table opportunities add column if not exists closed_at timestamptz;
update opportunities set published_at = created_at where published_at is null and status <> 'draft';
update opportunities set closed_at = updated_at where closed_at is null and status in ('closed', 'filled');

create index if not exists work_submissions_contributor_status_idx on work_submissions (contributor_wallet, status);
create index if not exists applications_contributor_status_idx on applications (contributor_wallet, status);
create index if not exists opportunities_owner_status_idx on opportunities (owner_wallet, status);

-- Nonces: who asked (IP hash) and when, so limits apply per requester, not per wallet.
alter table passport_nonces add column if not exists requester text;
alter table passport_nonces add column if not exists created_at timestamptz not null default now();
create index if not exists passport_nonces_requester_idx on passport_nonces (requester, created_at desc);
create index if not exists passport_nonces_address_created_idx on passport_nonces (address, created_at desc);

-- Last good Chog holder snapshot (owner -> token ids) and per-wallet tx counts.
create table if not exists chog_snapshot (
  id integer primary key,
  owners jsonb not null,
  built_at timestamptz not null default now()
);

create table if not exists onchain_tx_counts (
  wallet text primary key,
  tx_count integer not null,
  fetched_at timestamptz not null default now()
);
