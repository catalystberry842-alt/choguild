-- Chog-vs-Chog duels. Async: the challenger picks three moves, the defender auto-plays from its
-- signature move and tier, resolved on the server. XP is fixed at insert time (diminishing, capped).
create table if not exists chog_duels (
  id text primary key,
  challenger_id integer not null,
  defender_id integer not null,
  challenger_wallet text not null,
  defender_wallet text not null,
  day date not null,
  challenger_picks text not null,
  defender_picks text not null,
  challenger_level integer not null,
  defender_level integer not null,
  challenger_score integer not null,
  defender_score integer not null,
  outcome text not null,
  challenger_xp integer not null,
  defender_xp integer not null,
  created_at timestamptz not null default now(),
  constraint chog_duels_outcome_chk check (outcome in ('win', 'loss', 'draw')),
  constraint chog_duels_self_chk check (challenger_id <> defender_id and challenger_wallet <> defender_wallet)
);
create index if not exists chog_duels_challenger_idx on chog_duels (challenger_id, created_at desc);
create index if not exists chog_duels_defender_idx on chog_duels (defender_id, created_at desc);
create index if not exists chog_duels_wallet_day_idx on chog_duels (challenger_wallet, day);
