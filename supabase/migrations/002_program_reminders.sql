-- Optional Aether program reminders (Phase 3)
-- Apply in the Supabase SQL editor or via CLI migration.
-- When credentials are missing, the app keeps reminders in localStorage only.

create table if not exists public.program_reminders (
  id text primary key,
  program_id text not null,
  program_title text not null,
  channel_id text not null,
  channel_name text not null,
  fire_at_ms bigint not null,
  created_at_ms bigint not null,
  fired boolean not null default false,
  dismissed boolean not null default false,
  inserted_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists program_reminders_fire_at_ms_idx
  on public.program_reminders (fire_at_ms);

create index if not exists program_reminders_dismissed_idx
  on public.program_reminders (dismissed);

alter table public.program_reminders enable row level security;

drop policy if exists "anon can upsert program_reminders" on public.program_reminders;
create policy "anon can upsert program_reminders"
  on public.program_reminders
  for all
  to anon
  using (true)
  with check (true);
