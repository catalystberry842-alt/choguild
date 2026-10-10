create table if not exists opportunities (
  id text primary key,
  owner_wallet text not null,
  project_name text not null,
  project_logo_url text,
  title text not null,
  summary text not null,
  description text not null,
  scope text not null,
  deliverables text not null,
  required_skills jsonb not null default '[]'::jsonb,
  preferred_skills jsonb not null default '[]'::jsonb,
  category text not null,
  compensation_type text not null,
  compensation_details text,
  time_commitment text,
  deadline timestamptz,
  instructions text not null,
  question text,
  positions integer,
  status text not null default 'draft',
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint opportunities_status_chk check (status in ('draft', 'open', 'closed', 'filled')),
  constraint opportunities_category_chk check (category in ('content', 'development', 'design', 'research', 'community', 'marketing', 'other')),
  constraint opportunities_compensation_chk check (compensation_type in ('paid', 'token', 'grant', 'revenue', 'unpaid')),
  constraint opportunities_positions_chk check (positions is null or (positions >= 1 and positions <= 20))
);

create index if not exists opportunities_status_created_idx on opportunities (status, created_at desc);
create index if not exists opportunities_owner_idx on opportunities (owner_wallet);

create table if not exists applications (
  id text primary key,
  opportunity_id text not null references opportunities (id),
  contributor_wallet text not null,
  introduction text not null,
  suitability text not null,
  experience text,
  links jsonb not null default '[]'::jsonb,
  extra_answer text,
  status text not null default 'submitted',
  feedback text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint applications_status_chk check (status in ('submitted', 'under_review', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  constraint applications_one_per_contributor unique (opportunity_id, contributor_wallet)
);

create index if not exists applications_contributor_idx on applications (contributor_wallet, created_at desc);
create index if not exists applications_opportunity_idx on applications (opportunity_id, created_at desc);

create table if not exists application_events (
  id text primary key,
  application_id text not null references applications (id),
  status text not null,
  created_at timestamptz not null default now()
);

create index if not exists application_events_application_idx on application_events (application_id, created_at);

insert into opportunities (
  id, owner_wallet, project_name, title, summary, description, scope, deliverables,
  required_skills, preferred_skills, category, compensation_type, compensation_details,
  time_commitment, deadline, instructions, question, positions, status, is_demo
) values
(
  'demo-writer',
  'demo',
  'Example · North Annex',
  'Technical writer for a protocol note',
  'Example role. Write a short contributor-facing note. This is not a live project.',
  'Example description. A protocol wants a plain-language note that explains how a contributor passport is used. No real organization is attached to this record.',
  'Example scope. One note, reviewed once, then the example ends.',
  'Example deliverable. A 600-word note in Markdown.',
  '["Content writing","Research"]'::jsonb,
  '["Community"]'::jsonb,
  'content',
  'unpaid',
  null,
  'Example · about 6 hours',
  now() + interval '21 days',
  'Example instructions. Do not apply. This record exists so the board can be reviewed.',
  'Example question. What have you explained recently?',
  1,
  'open',
  true
),
(
  'demo-frontend',
  'demo',
  'Example · Field Notes',
  'Frontend contributor for an ecosystem tool',
  'Example role. Help shape a public contributor page. This is not a live project.',
  'Example description. The tool is fictional. The listing shows how a development opportunity reads on the board.',
  'Example scope. A small interface pass. No repository access is granted.',
  'Example deliverable. A written interface note, not a merged pull request.',
  '["Development","Design"]'::jsonb,
  '[]'::jsonb,
  'development',
  'token',
  'Example terms only. No token is allocated and none is guaranteed.',
  'Example · about 10 hours',
  now() + interval '4 days',
  'Example instructions. Applications are closed on purpose because this is a sample.',
  null,
  2,
  'open',
  true
),
(
  'demo-research',
  'demo',
  'Example · Harbor Index',
  'Community researcher',
  'Example role. Map how contributors describe their work. This is not a live project.',
  'Example description. The research subject is fictional. Use it to judge filters, skills, and the details page.',
  'Example scope. A short reading list and three observations.',
  'Example deliverable. A one-page brief.',
  '["Research","Community"]'::jsonb,
  '["Content writing"]'::jsonb,
  'research',
  'grant',
  'Example terms only. No grant exists and nothing will be paid.',
  'Example · about 8 hours',
  now() + interval '30 days',
  'Example instructions. Do not send work. This sample does not accept applications.',
  null,
  1,
  'open',
  true
),
(
  'demo-design',
  'demo',
  'Example · Lantern Desk',
  'Designer for a contributor portal',
  'Example role. This sample is closed so the closed state can be checked.',
  'Example description. A fictional portal. The listing stays visible and explains that applications are not open.',
  'Example scope. A single screen. The example is already closed.',
  'Example deliverable. None. The sample never hired anyone.',
  '["Design"]'::jsonb,
  '["Content writing"]'::jsonb,
  'design',
  'paid',
  'Example amount only. Nothing is owed and nobody was paid.',
  'Example · about 12 hours',
  now() - interval '2 days',
  'Example instructions. Applications are closed.',
  null,
  1,
  'closed',
  true
)
on conflict (id) do nothing;
