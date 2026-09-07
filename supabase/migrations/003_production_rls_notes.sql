-- Phase 6: production-oriented RLS notes for Aether telemetry + reminders.
-- Apply AFTER 001_client_events.sql and 002_program_reminders.sql.
--
-- DESIGN NOTES
-- ------------
-- The browser uses the Supabase *anon* key. Without Auth, policies must either:
--   (A) stay open for anon insert/upsert (demo / personal projects), or
--   (B) require authenticated users and scope rows by auth.uid().
--
-- This migration documents both paths. Default: keep demo-friendly anon write
-- policies from 001/002, and ADD optional authenticated-scoped policies plus
-- a `client_key` / `profile_id` column for future hardening.
--
-- RECOMMENDED PRODUCTION PATH
-- 1. Enable Email/OAuth Auth in Supabase.
-- 2. Switch the app to signed-in sessions (supabase.auth).
-- 3. Drop the open anon policies below once Auth is live.
-- 4. Keep service-role key server-side only (never in Vite).

-- --- client_events: optional session/profile tags ---
alter table public.client_events
  add column if not exists profile_id text,
  add column if not exists user_id uuid references auth.users (id);

create index if not exists client_events_user_id_idx
  on public.client_events (user_id);

create index if not exists client_events_profile_id_idx
  on public.client_events (profile_id);

-- Authenticated users can insert their own telemetry (when Auth is enabled).
drop policy if exists "auth can insert own client_events" on public.client_events;
create policy "auth can insert own client_events"
  on public.client_events
  for insert
  to authenticated
  with check (auth.uid() = user_id OR user_id is null);

drop policy if exists "auth can read own client_events" on public.client_events;
create policy "auth can read own client_events"
  on public.client_events
  for select
  to authenticated
  using (auth.uid() = user_id);

-- --- program_reminders: optional ownership ---
alter table public.program_reminders
  add column if not exists profile_id text,
  add column if not exists user_id uuid references auth.users (id);

create index if not exists program_reminders_user_id_idx
  on public.program_reminders (user_id);

create index if not exists program_reminders_profile_id_idx
  on public.program_reminders (profile_id);

drop policy if exists "auth can manage own program_reminders" on public.program_reminders;
create policy "auth can manage own program_reminders"
  on public.program_reminders
  for all
  to authenticated
  using (auth.uid() = user_id OR user_id is null)
  with check (auth.uid() = user_id OR user_id is null);

-- PRODUCTION HARDENING CHECKLIST (run manually when ready):
--   drop policy if exists "anon can insert client_events" on public.client_events;
--   drop policy if exists "anon can read client_events" on public.client_events;
--   drop policy if exists "anon can upsert program_reminders" on public.program_reminders;
--   -- then rely solely on authenticated policies above.
--
-- Until Auth is wired in the app (Settings → Account via supabaseAuth.ts),
-- leave the anon policies from 001/002 in place so the demo app can sync
-- without login. Treat that as non-production.
--
-- APP WIRING (complete in code):
--   src/lib/supabaseClient.ts  — shared client
--   src/lib/supabaseAuth.ts    — sign-in / sign-out / session
--   Settings Account section   — UI when VITE_SUPABASE_* present
--   eventLogger + reminderSync — attach user_id when signed in
-- After users can sign in, drop anon policies above for production.
