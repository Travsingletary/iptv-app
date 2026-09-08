# Aether — Premium IPTV Player

A cable / Netflix-style IPTV experience for the web: live TV, electronic program guide, on-demand rails, favorites, M3U / MegaOTT import, multi-view, and an assistant agent.

## Phase map

| Phase | Status | Highlights | Verify |
| --- | --- | --- | --- |
| 1 | Done | Assistant panel, telemetry, For You Now, `/api/assistant` (Live AI when keyed) | `npm test` / `npm run verify:phase1` |
| 2 | Done | Voice intents, reminders, stream fallback chips | `npm run verify:phase2` |
| 3 | Done | Agent loop, automation rules, provider adapter, reminder sync | `npm run verify:phase3` |
| 4 | Done | Real LLM tools loop (API key), household profiles, NL EPG, reminder UX | `npm run verify:phase4` |
| 5 | Done | MegaOTT / Xtream-compatible login, catch-up stub, 2/4-up multi-view, TV focus | `npm run verify:phase5` |
| 6 | Done | Supabase RLS notes, CI e2e suite, README/env docs | `npm run verify:phase6` / `npm run test:e2e` |
| Finish | Done | Auth UI, AI mode indicator, MegaOTT/catch-up harden, multi-view audio | `npm run verify:finish` |

Verify-before-building is enforced in `AGENTS.md` and `documents/ai_memory/ai_memory.md`.

## Features

- **Live TV** with HLS.js playback, channel groups, search, and zap controls
- **TV Guide (EPG)** timeline with now-line, jump-to-now, and tune-from-guide
- **On Demand** poster grid + detail sheet for movies/series in the playlist
- **Multi-view** 2-up / 4-up live mosaic with per-slot focus and **single audible pane**
- **Home** Netflix-style hero + content rails
- **Favorites** and continue-watching
- **M3U import** via URL or paste (Settings) — MegaOTT `get.php` links work; paste if CORS blocks fetch
- **MegaOTT** portal URL + username + password (Xtream-compatible `player_api.php`) with graceful demo fallback
- **Catch-up / timeshift** — demo stub when archive unavailable; real `timeshift.php` URLs when MegaOTT / panel advertises `tv_archive`
- **Household profiles** with separate favorites bias and assistant memory
- **Supabase Auth** (optional) — Settings sign-in/out when `VITE_SUPABASE_*` is set
- **Assistant agent** multi-step tools, NL EPG (“sports in next 2 hours”), confirm gates; **Mock AI** by default, **Live AI** with a key
- **Automation rules** buffering fallback, favorite lead reminders, auto-alternate on error
- Keyboard: `Space` play/pause · `↑/↓` zap (Live) · `M` mute · `G` guide · `H` home · `V` multi-view · D-pad spatial focus

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL, choose **Enter with demo pack**, then browse Home / Live / Guide / On Demand / Multi-view.

## Demo vs live

| Capability | Without secrets (demo) | With credentials |
| --- | --- | --- |
| Playback / guide / multi-view | Full demo HLS pack | Your M3U / MegaOTT playlist |
| Assistant | **Mock AI** (deterministic tools) | **Live AI** via `OPENAI_API_KEY` |
| Reminders / telemetry | `localStorage` | Supabase sync (`VITE_SUPABASE_*`) |
| Account / RLS | Auth section disabled | Sign in → rows tagged with `user_id` |
| Catch-up | Stub URL (`aether_catchup=`) | Real timeshift when panel has `tv_archive` |

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (includes `GET/POST /api/assistant`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build (also mounts `/api/assistant`) |
| `npm run start:api` | Companion Node server: serves `dist/` + `/api/assistant` |
| `npm test` | Unit tests |
| `npm run verify:phase1` … `verify:phase6` | Per-phase Playwright runtime checks |
| `npm run verify:finish` | Finish-pass Auth / AI mode / catch-up / multi-view checks |
| `npm run test:e2e` | Run phases 2–6 + finish e2e against `AETHER_URL` |

CI tip: start `npm run dev` (or `npm run start:api` after build), then `AETHER_URL=http://127.0.0.1:5173 npm run test:e2e`.

## Environment

Copy `.env.example` → `.env.local`:

| Variable | Role |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Optional telemetry + reminder sync + Auth UI |
| `OPENAI_API_KEY` | Enables real multi-round tools loop on the server |
| `AI_PROVIDER` / `OPENAI_BASE_URL` / `OPENAI_MODEL` | Optional OpenAI-compatible gateway |
| `VITE_OPENAI_API_KEY` etc. | Client-only fallback when `/api/assistant` is absent |
| `PORT` | Companion server port (`npm run start:api`, default `4173`) |

Without AI keys the deterministic mock agent still runs (Settings shows **Mock AI**). Without Supabase, events and reminders stay in `localStorage` and Auth stays disabled.

### MegaOTT fields (Settings)

| Field | Required | Notes |
| --- | --- | --- |
| Portal / server URL | Yes | Streaming DNS/Server from MegaOTT email/app (`http://host:port`). Not the website login (`https://megaott.net/login`). |
| Username | Yes | MegaOTT username |
| Password | Yes | MegaOTT password |
| Playlist / get.php URL | Optional | Paste full M3U link to auto-fill credentials or ingest |
| Archive | Provider | Channels with `tv_archive=1` enable catch-up + timeshift URLs |

Advanced: collapsed **Xtream-compatible API** uses the same fields with Xtream labeling.

Browser CORS may block some remote panels or `get.php` fetches; paste an M3U as a workaround.

## Assistant API

1. **Vite middleware** — `npm run dev` / `npm run preview` expose `GET/POST /api/assistant`.
2. **Companion server** — `npm run build` then `npm run start:api`.
3. **Client fallback** — pure static hosting runs `assistantCore` / `agentLoop` in-browser.
4. **Mock by default** — allowlisted multi-step tools without keys (`GET /api/assistant` → `{ aiMode: "mock" }`).
5. **Real tools loop** — with `OPENAI_API_KEY`, server runs model → tool_calls → local allowlist → model rounds.

Body: `{ message, context, confirmed? }`. Confirm-risk tools stay pending until `confirmed: true`.

## Supabase

Apply migrations in order:

1. `supabase/migrations/001_client_events.sql`
2. `supabase/migrations/002_program_reminders.sql`
3. `supabase/migrations/003_production_rls_notes.sql`

See `supabase/RLS.md` for Auth wiring and production hardening (Auth-scoped policies; drop open anon policies when ready).

## Stack

React 19 · Vite · TypeScript · Tailwind · Zustand · Framer Motion · HLS.js · Supabase JS (optional)

## Notes

- Some remote M3U / MegaOTT portal URLs are blocked by browser CORS; paste import still works.
- Demo streams are public HLS test assets — not a commercial IPTV service.
- Demo catch-up is a documented stub (`aether_catchup=` query) because public samples have no MegaOTT archive.
- Bring your own legal playlist / provider credentials.
- Headless / some browsers lack `SpeechRecognition` — typed assistant intents still work.
