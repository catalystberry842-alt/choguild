-- Optional "Chog Genesis holders only" gate on a listing, enforced server-side when applying.
alter table opportunities add column if not exists holders_only boolean not null default false;
