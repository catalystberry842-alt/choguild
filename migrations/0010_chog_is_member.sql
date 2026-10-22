-- v3: the Chog is the member. Records are keyed to `chog:<tokenId>` instead of a wallet.
-- Wallet passports whose wallet held a Chog in the last persisted ownerOf snapshot move onto
-- that wallet's lowest token id (with their listings, applications, submissions and events).
-- Passports with no Chog are archived (copied to archived_wallet_passports, hidden from the ladder);
-- if that wallet later acts as a Chog with no passport, the app re-keys the record onto it.

create table if not exists archived_wallet_passports as
  select * from contributor_profiles where false;
alter table archived_wallet_passports add column if not exists archived_at timestamptz not null default now();

create temporary table chog_map as
  select lower(o.key) as wallet, 'chog:' || min((v.value)::int)::text as actor
  from chog_snapshot s, jsonb_each(s.owners) o, jsonb_array_elements_text(o.value) v
  where s.id = 1
  group by lower(o.key);

-- never map onto a Chog that already has a passport
delete from chog_map m where exists (select 1 from contributor_profiles p where p.wallet_address = m.actor);

update opportunities o set owner_wallet = m.actor from chog_map m
  where o.owner_wallet = m.wallet and exists (select 1 from contributor_profiles p where p.wallet_address = m.wallet);
update applications a set contributor_wallet = m.actor from chog_map m
  where a.contributor_wallet = m.wallet and exists (select 1 from contributor_profiles p where p.wallet_address = m.wallet);
update work_submissions w set contributor_wallet = m.actor from chog_map m
  where w.contributor_wallet = m.wallet and exists (select 1 from contributor_profiles p where p.wallet_address = m.wallet);
update submission_events e set actor_wallet = m.actor from chog_map m
  where e.actor_wallet = m.wallet and exists (select 1 from contributor_profiles p where p.wallet_address = m.wallet);
update contributor_profiles p set wallet_address = m.actor, avatar_url = '/api/chog/' || substr(m.actor, 6), updated_at = now()
  from chog_map m where p.wallet_address = m.wallet;

insert into archived_wallet_passports
  select p.*, now() from contributor_profiles p where p.wallet_address not like 'chog:%';

drop table chog_map;

create table if not exists chog_quests (
  chog_id integer not null,
  wallet text not null,
  day date not null,
  quest text not null,
  xp integer not null,
  created_at timestamptz not null default now(),
  primary key (chog_id, day, quest),
  constraint chog_quests_quest_chk check (quest in ('checkin', 'scout', 'rival'))
);
-- one Chog per wallet per quest per day: holding ten Chogs doesn't mean ten times the quest XP
create unique index if not exists chog_quests_wallet_day_key on chog_quests (wallet, day, quest);
create index if not exists chog_quests_chog_idx on chog_quests (chog_id, day desc);
