-- Listings still keyed to a wallet (their publisher had no Chog when v3 archived wallet passports)
-- have no member behind them. Close them so they leave the board; every row is kept.
alter table opportunities add column if not exists orphaned_at timestamptz;
update opportunities set status = 'closed', closed_at = coalesce(closed_at, now()), orphaned_at = now(), updated_at = now()
  where owner_wallet not like 'chog:%' and owner_wallet <> 'demo' and status in ('open', 'draft') and orphaned_at is null;
