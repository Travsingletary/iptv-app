# Aether — Premium IPTV Player

A cable / Netflix-style IPTV experience for the web: live TV, electronic program guide, on-demand rails, favorites, M3U import, and smooth motion throughout.

## Features

- **Live TV** with HLS.js playback, channel groups, search, and zap controls
- **TV Guide (EPG)** timeline with now-line, jump-to-now, and tune-from-guide
- **On Demand** poster grid + detail sheet for movies/series in the playlist
- **Home** Netflix-style hero + content rails
- **Favorites** and continue-watching
- **M3U import** via URL or paste (Settings)
- **Demo pack** with public HLS samples so you can explore without a subscription
- **Assistant agent (Phase 3)** multi-step tool plans, confirm for destructive actions, conversation memory
- **Automation rules** buffering fallback suggestions, favorite start reminders, auto-try alternate on stream error
- Keyboard: `Space` play/pause · `↑/↓` zap · `M` mute · `G` guide · `H` home

## Quick start

```bash
npm install
npm run dev
```

Open the printed local URL, choose **Enter with demo pack**, then browse Home / Live / Guide / On Demand.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Dev server (includes `POST /api/assistant`) |
| `npm run build` | Production build |
| `npm run preview` | Preview build (also mounts `/api/assistant`) |
| `npm run start:api` | Companion Node server: serves `dist/` + `/api/assistant` |
| `npm test` | Unit tests (assistant agent / automation / M3U / …) |

## Assistant API

Phase 3 keeps the assistant provider-agnostic with a real agent loop:

1. **Vite middleware** — `npm run dev` and `npm run preview` expose `POST /api/assistant`.
2. **Companion server** — after `npm run build`, run `npm run start:api` for a static+API host without Vite.
3. **Client fallback** — if `/api/assistant` is unavailable (pure static hosting), the UI runs `assistantCore` / `agentLoop` in-browser.
4. **Mock by default** — without API keys, the deterministic multi-step agent still executes allowlisted tools.
5. **Optional provider** — set `AI_PROVIDER` + `OPENAI_API_KEY` (and optional `OPENAI_BASE_URL` / `OPENAI_MODEL`) for an OpenAI-compatible chat+tools adapter. Client `VITE_*` equivalents exist for pure local fallback.

Body: `{ message, context, confirmed? }`. Confirm-risk tools (e.g. clear reminders) stay pending until `confirmed: true`.

## Automation rules

Settings → **Automation rules** (persisted in `localStorage` as `aether_automation_rules_v1`):

- Suggest fallback when buffering exceeds N seconds
- Remind before favorite-channel programs start
- Auto-try an alternate in the same group on live stream error

## Telemetry & reminders (Supabase)

Copy `.env.example` → `.env.local` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Apply migrations:

- `supabase/migrations/001_client_events.sql`
- `supabase/migrations/002_program_reminders.sql`

When credentials are missing, events and reminders stay in `localStorage` and never block playback.

## Stack

React 19 · Vite · TypeScript · Tailwind · Zustand · Framer Motion · HLS.js · Supabase JS (optional)

## Notes

- Some remote M3U URLs are blocked by browser CORS; paste import still works.
- Demo streams are public HLS test assets — not a commercial IPTV service.
- Bring your own legal playlist / provider credentials.
