create index if not exists applications_contributor_idx
  on applications (contributor_wallet, created_at desc);

create index if not exists passport_nonces_address_open_idx
  on passport_nonces (address)
  where used_at is null;
