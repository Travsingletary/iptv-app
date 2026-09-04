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
- **Assistant** (Phase 1) with executable tools: recommend, EPG search, play channel
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
| `npm test` | Unit tests (M3U / EPG / assistant / recommendations) |

## Assistant API

Phase 1 keeps the assistant provider-agnostic:

1. **Vite middleware** — `npm run dev` and `npm run preview` expose `POST /api/assistant`.
2. **Companion server** — after `npm run build`, run `npm run start:api` for a static+API host without Vite.
3. **Client fallback** — if `/api/assistant` is unavailable (pure static hosting), the UI runs `assistantCore` in-browser. Tools still execute (`play_channel`, recommendations, EPG results).

Optional env keys (`AI_PROVIDER` / `OPENAI_API_KEY` or `VITE_*` equivalents) are reserved for a real model adapter; without them the deterministic mock path is used.

## Telemetry (Supabase)

Copy `.env.example` → `.env.local` and set:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Apply `supabase/migrations/001_client_events.sql` in your project. When credentials are missing, events buffer in `localStorage` (`aether_event_buffer`) and never block playback.

## Stack

React 19 · Vite · TypeScript · Tailwind · Zustand · Framer Motion · HLS.js · Supabase JS (optional)

## Notes

- Some remote M3U URLs are blocked by browser CORS; paste import still works.
- Demo streams are public HLS test assets — not a commercial IPTV service.
- Bring your own legal playlist / provider credentials.
