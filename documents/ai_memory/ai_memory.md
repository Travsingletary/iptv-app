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

- Phase 1 verified: assistant panel, event buffer telemetry, For You Now, `/api/assistant` tools; Live AI when `OPENAI_API_KEY` is set (`e2e/verify-phase1.mjs`). `.env` AI keys preferred over stale shell exports.
- Phase 2 verified: voice intents, reminders, stream fallback chips (`e2e/verify-phase2.mjs`). Live AI mute/remind tool-merge harden (`assistantCore` fills missing local tools on clear commands).
- Phase 3 verified: agent loop (`agentLoop`), automation rules, OpenAI-compatible provider adapter (env-gated), optional Supabase reminder sync (`e2e/verify-phase3.mjs`).
- Phase 4 verified: OpenAI-compatible multi-round tools loop (API key gated), household profiles, NL EPG search, reminder sync UX (`e2e/verify-phase4.mjs`).
- Phase 5 verified: Xtream login + demo fallback, catchup/timeshift stub UX, 2/4-up multi-view, TV spatial focus (`e2e/verify-phase5.mjs`).
- Phase 6 verified: Supabase RLS notes/migration, CI e2e suite (`test:e2e`), README phase map + env docs (`e2e/verify-phase6.mjs`).
- Finish pass verified: Supabase Auth Settings UI (demo-safe), AI Mock/Live indicator, Xtream/catch-up harden, multi-view single audible pane (`e2e/verify-finish.mjs`).
- Autonomous re-verify (2026-09-07): `verify:phase1` → `PHASE1_VERIFY_OK` (Live AI); `test:e2e` → `VERIFY_ALL_OK`; `npm test` 50; `npm run build` OK.

### Still needs user credentials (not finishable in-repo)

- Real Xtream ingest + archive catch-up: Settings panel URL + username + password with `tv_archive` enabled
- Production RLS / Auth: `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` + Auth users, then drop anon policies per `supabase/RLS.md`
- Live LLM: `OPENAI_API_KEY` already working in this environment (optional `OPENAI_BASE_URL` / `OPENAI_MODEL`)
