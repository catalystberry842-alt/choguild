create table if not exists work_submissions (
  id text primary key,
  opportunity_id text not null references opportunities (id),
  application_id text not null references applications (id),
  contributor_wallet text not null,
  status text not null default 'draft',
  public_evidence boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint work_submissions_status_chk check (
    status in ('draft', 'submitted', 'under_review', 'accepted', 'changes_requested', 'rejected')
  ),
  constraint work_submissions_one_per_application unique (application_id)
);

create index if not exists work_submissions_contributor_idx on work_submissions (contributor_wallet, updated_at desc);
create index if not exists work_submissions_opportunity_idx on work_submissions (opportunity_id, status);

create table if not exists submission_versions (
  id text primary key,
  submission_id text not null references work_submissions (id),
  version integer not null,
  title text not null,
  description text not null,
  repo_url text,
  document_url text,
  notes text,
  evidence_links jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint submission_versions_unique unique (submission_id, version)
);

create table if not exists submission_events (
  id text primary key,
  submission_id text not null references work_submissions (id),
  actor_wallet text not null,
  from_status text,
  to_status text not null,
  comment text,
  private_note text,
  created_at timestamptz not null default now()
);

create index if not exists submission_events_submission_idx on submission_events (submission_id, created_at);
