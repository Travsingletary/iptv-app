# AI Memory

- Prefer concise, tested claims only.
- Product brand for this repo: **Aether** premium IPTV player.
- Design: ink/sand/ember palette, Bricolage Grotesque + Sora; cinematic dark media UI is intentional for IPTV/Netflix parity.

## Verify-before-building gate (HARD RULE)

- After every non-trivial change, verify with runtime evidence (automated tests and/or manual UI/API checks) before starting the next feature or change.
- Do not stack new work on unverified or broken foundations.
- If verification fails, fix first — then re-verify.
- Prefer honest partial/failed status over claiming success.
- Applies to all Cursor agents working in this repository.

## Phase status

- Phase 2 verified: voice intents, reminders, stream fallback chips (`e2e/verify-phase2.mjs`).
- Phase 3: agent loop (`agentLoop`), automation rules, OpenAI-compatible provider adapter (env-gated), optional Supabase reminder sync.

- Phase 4 verified: OpenAI-compatible multi-round tools loop (API key gated), household profiles, NL EPG search, reminder sync UX (`e2e/verify-phase4.mjs`).

- Phase 5 verified: Xtream login + demo fallback, catchup/timeshift stub UX, 2/4-up multi-view, TV spatial focus (`e2e/verify-phase5.mjs`).

- Phase 6 verified: Supabase RLS notes/migration, CI e2e suite (`test:e2e`), README phase map + env docs (`e2e/verify-phase6.mjs`).

- Finish pass: Supabase Auth Settings UI (demo-safe), AI Mock/Live indicator, Xtream/catch-up harden, multi-view single audible pane, expanded e2e (`e2e/verify-finish.mjs`).

### Still needs user credentials (not finishable in-repo)

- Live LLM: `OPENAI_API_KEY` (optional `OPENAI_BASE_URL` / `OPENAI_MODEL`)
- Real Xtream ingest + archive catch-up: panel URL + username + password with `tv_archive`
- Production RLS: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` + Auth users, then drop anon policies

