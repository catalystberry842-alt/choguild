create table if not exists contributor_profiles (
  id text primary key,
  username text not null,
  display_name text not null,
  biography text not null,
  avatar_url text,
  skills jsonb not null default '[]'::jsonb,
  portfolio_url text,
  github_url text,
  x_url text,
  other_links jsonb not null default '[]'::jsonb,
  interests text,
  wallet_address text not null,
  visibility text not null default 'public',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint contributor_profiles_visibility_chk check (visibility in ('public', 'unlisted'))
);

create unique index if not exists contributor_profiles_username_key
  on contributor_profiles (username);

create unique index if not exists contributor_profiles_wallet_key
  on contributor_profiles (wallet_address);

create table if not exists passport_nonces (
  id text primary key,
  address text not null,
  nonce text not null,
  message text not null,
  expires_at timestamptz not null,
  used_at timestamptz
);

create unique index if not exists passport_nonces_nonce_key on passport_nonces (nonce);

create table if not exists passport_sessions (
  id text primary key,
  address text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists passport_sessions_address_idx on passport_sessions (address);
