# Supabase RLS for Aether

## Tables

| Migration | Table | Purpose |
| --- | --- | --- |
| `001_client_events.sql` | `client_events` | Browser telemetry |
| `002_program_reminders.sql` | `program_reminders` | Program reminders sync |
| `003_production_rls_notes.sql` | both | Auth-scoped policies + hardening notes |

## Demo / personal (default)

Anon key may insert/upsert. Fine for local demos. **Not** multi-tenant safe.

## Production

1. Enable Supabase Auth.
2. Apply `003_production_rls_notes.sql`.
3. Drop open anon policies (commands listed in that migration).
4. Never expose the service-role key to Vite/`VITE_*`.
5. Keep localStorage fallback so missing credentials never block playback.
