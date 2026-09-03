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
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview build |
| `npm test` | Unit tests (M3U / EPG parsers) |

## Stack

React 19 · Vite · TypeScript · Tailwind · Zustand · Framer Motion · HLS.js

## Notes

- Some remote M3U URLs are blocked by browser CORS; paste import still works.
- Demo streams are public HLS test assets — not a commercial IPTV service.
- Bring your own legal playlist / provider credentials.
