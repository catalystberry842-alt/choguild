-- v17: uploaded passport avatars. Images are cropped/compressed in the browser
-- (512px WebP/JPEG, <200 KB) and stored here, served by /api/avatar/:id.
-- portfolio_url on contributor_profiles is no longer read or written; the
-- column stays so a rollback to the previous deploy keeps working.
create table if not exists passport_avatars (
  id text primary key,
  wallet_address text not null,
  content_type text not null,
  byte_size integer not null,
  bytes bytea not null,
  created_at timestamptz not null default now()
);
create index if not exists passport_avatars_wallet_idx on passport_avatars (wallet_address, created_at desc);
