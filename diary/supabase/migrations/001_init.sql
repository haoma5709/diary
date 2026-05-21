create table diary_entries (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null,
  date            date not null,
  raw_notes       jsonb not null default '[]',
  generations     jsonb not null default '[]',
  pinned_gen_idx  int,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique(user_id, date)
);

alter table diary_entries enable row level security;

create policy "只能读写自己的日记" on diary_entries
  for all using (auth.uid() = user_id);

create index diary_entries_user_date_idx on diary_entries(user_id, date);
