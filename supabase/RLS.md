# Supabase RLS for Aether

## Tables

| Migration | Table | Purpose |
| --- | --- | --- |
| `001_client_events.sql` | `client_events` | Browser telemetry |
| `002_program_reminders.sql` | `program_reminders` | Program reminders sync |
| `003_production_rls_notes.sql` | both | Auth-scoped policies + hardening notes |

## Demo / personal (default)

Anon key may insert/upsert. Fine for local demos. **Not** multi-tenant safe.

## Auth path (wired in app)

The client ships Supabase Auth helpers (`src/lib/supabaseAuth.ts`) and a Settings **Account** section:

1. Set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`.
2. Enable Email Auth in the Supabase project.
3. Sign in from Settings — session persists via `@supabase/supabase-js`.
4. Telemetry (`client_events`) and reminder sync tag rows with `user_id` when signed in.
5. Apply `003_production_rls_notes.sql`, then drop open anon policies (commands in that migration).

Without env credentials, Settings shows a clear disabled/demo state and never crashes.

## Production checklist

1. Enable Supabase Auth.
2. Apply `003_production_rls_notes.sql`.
3. Drop open anon policies (commands listed in that migration).
4. Never expose the service-role key to Vite/`VITE_*`.
5. Keep localStorage fallback so missing credentials never block playback.
