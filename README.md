# Aether — Premium IPTV Player

A cable / Netflix-style IPTV experience for the web: live TV, electronic program guide, on-demand rails, favorites, M3U / Xtream import, multi-view, and an assistant agent.

## Phase map

| Phase | Status | Highlights | Verify |
| --- | --- | --- | --- |
| 1 | Done | Assistant panel, telemetry, For You Now, `/api/assistant` | `npm test` |
| 2 | Done | Voice intents, reminders, stream fallback chips | `npm run verify:phase2` |
| 3 | Done | Agent loop, automation rules, provider adapter, reminder sync | `npm run verify:phase3` |
| 4 | Done | Real LLM tools loop (API key), household profiles, NL EPG, reminder UX | `npm run verify:phase4` |
| 5 | Done | Xtream login, catch-up stub, 2/4-up multi-view, TV focus | `npm run verify:phase5` |
| 6 | Done | Supabase RLS notes, CI e2e suite, README/env docs | `npm run verify:phase6` / `npm run test:e2e` |

Verify-before-building is enforced in `AGENTS.md` and `documents/ai_memory/ai_memory.md`.

## Features

- **Live TV** with HLS.js playback, channel groups, search, and zap controls
- **TV Guide (EPG)** timeline with now-line, jump-to-now, and tune-from-guide
- **On Demand** poster grid + detail sheet for movies/series in the playlist
- **Multi-view** 2-up / 4-up live mosaic with per-slot focus
- **Home** Netflix-style hero + content rails
- **Favorites** and continue-watching
- **M3U import** via URL or paste (Settings)
- **Xtream Codes** server/user/pass login with graceful demo fallback
- **Catch-up / timeshift** controls when a channel advertises archive (demo stub + docs)
- **Household profiles** with separate favorites bias and assistant memory
- **Assistant agent** multi-step tools, NL EPG (“sports in next 2 hours”), confirm gates
- **Automation rules** buffering fallback, favorite lead reminders, auto-alternate on error
- Keyboard: `Space` play/pause · `↑/↓` zap · `M` mute · `G` guide · `H` home · `V` multi-view

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL, choose **Enter with demo pack**, then browse Home / Live / Guide / On Demand / Multi-view.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (includes `POST /api/assistant`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build (also mounts `/api/assistant`) |
| `npm run start:api` | Companion Node server: serves `dist/` + `/api/assistant` |
| `npm test` | Unit tests |
| `npm run verify:phase2` … `verify:phase6` | Per-phase Playwright runtime checks |
| `npm run test:e2e` | Run phases 2–6 e2e against `AETHER_URL` |

CI tip: start `npm run dev` (or `npm run start:api` after build), then `AETHER_URL=http://127.0.0.1:5173 npm run test:e2e`.

## Environment

Copy `.env.example` → `.env.local`:

| Variable | Role |
| --- | --- |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | Optional telemetry + reminder sync |
| `OPENAI_API_KEY` | Enables real multi-round tools loop on the server |
| `AI_PROVIDER` / `OPENAI_BASE_URL` / `OPENAI_MODEL` | Optional OpenAI-compatible gateway |
| `VITE_OPENAI_API_KEY` etc. | Client-only fallback when `/api/assistant` is absent |
| `PORT` | Companion server port (`npm run start:api`, default `4173`) |

Without AI keys the deterministic mock agent still runs. Without Supabase, events and reminders stay in `localStorage`.

## Assistant API

1. **Vite middleware** — `npm run dev` / `npm run preview` expose `POST /api/assistant`.
2. **Companion server** — `npm run build` then `npm run start:api`.
3. **Client fallback** — pure static hosting runs `assistantCore` / `agentLoop` in-browser.
4. **Mock by default** — allowlisted multi-step tools without keys.
5. **Real tools loop** — with `OPENAI_API_KEY`, server runs model → tool_calls → local allowlist → model rounds.

Body: `{ message, context, confirmed? }`. Confirm-risk tools stay pending until `confirmed: true`.

## Supabase

Apply migrations in order:

1. `supabase/migrations/001_client_events.sql`
2. `supabase/migrations/002_program_reminders.sql`
3. `supabase/migrations/003_production_rls_notes.sql`

See `supabase/RLS.md` for production hardening (Auth-scoped policies; drop open anon policies when ready).

## Stack

React 19 · Vite · TypeScript · Tailwind · Zustand · Framer Motion · HLS.js · Supabase JS (optional)

## Notes

- Some remote M3U / Xtream URLs are blocked by browser CORS; paste import still works.
- Demo streams are public HLS test assets — not a commercial IPTV service.
- Demo catch-up is a documented stub (`aether_catchup=` query) because public samples have no archive.
- Bring your own legal playlist / provider credentials.
