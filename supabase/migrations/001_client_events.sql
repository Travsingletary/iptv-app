-- Aether client telemetry table for Supabase
-- Apply in the Supabase SQL editor or via CLI migration.

create table if not exists public.client_events (
  id bigint generated always as identity primary key,
  event_type text not null,
  created_at_ms bigint not null,
  payload jsonb not null default '{}'::jsonb,
  inserted_at timestamptz not null default timezone('utc', now())
);

create index if not exists client_events_event_type_idx
  on public.client_events (event_type);

create index if not exists client_events_created_at_ms_idx
  on public.client_events (created_at_ms desc);

alter table public.client_events enable row level security;

-- Anonymous insert for browser clients using the anon key.
-- Tighten for production (auth-bound policies, rate limits, etc.).
drop policy if exists "anon can insert client_events" on public.client_events;
create policy "anon can insert client_events"
  on public.client_events
  for insert
  to anon
  with check (true);

-- Optional: allow anon read for debugging dashboards (disable in prod if unused).
drop policy if exists "anon can read client_events" on public.client_events;
create policy "anon can read client_events"
  on public.client_events
  for select
  to anon
  using (true);
