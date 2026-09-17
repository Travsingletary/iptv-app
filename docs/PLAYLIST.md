# Playlist completeness (SteadyStream)

## What “whole playlist” means

| Surface | What you should see | Intentional limit |
| --- | --- | --- |
| **Live TV** | Every live channel from the panel / M3U | None in the UI. Lists are virtualized for performance. |
| **On Demand** | Category chips from the panel | Movie/series *titles* load **per category** on browse (lazy). Opening Live will not list VOD titles. |
| **Guide** | Same live catalog as Live TV (filtered by chips/search) | Rows are virtualized; EPG programs still depend on provider XMLTV/EPG data. |

## Fixed bug (persistence cap)

Older builds capped Zustand `localStorage` persistence at **500 channels**. After a reload, MegaOTT panels (~6.8k–7k live) looked incomplete even though the last import succeeded.

Current behavior:

- Persist **all live** channels (soft safety ceiling 20 000).
- Never persist panel VOD titles (reload categories on demand).
- If storage quota is exceeded, drop logos once, then fall back to credentials-only and refresh.
- If a session is stuck at exactly **500** live channels from a MegaOTT/Xtream source, SteadyStream **auto-refreshes** the live catalog in the background.
- Settings → **Refresh live catalog** forces a re-fetch without wiping already-loaded VOD titles.

## Category chips

**Default:** Live/Guide chips are **provider folders** — the real MegaOTT / Xtream `group` titles (e.g. `US|SPORTS|ESPN`), sorted by channel count (Favorites pinned). Choosing a chip filters to that folder; **All** shows the full live count.

**Optional:** Settings → Playback & UI → Live categories → **Smart buckets** collapses groups into News / Sports / Movies / Kids / … for a shorter chip row.

Normalized smart buckets remain available to the assistant / NL EPG even when chips are in provider mode.

## Panel caveats

- MegaOTT / Xtream `max_connections=1`: a second device or concurrent stream may kick the first.
- Chromium / Fire Stick WebView often cannot play **MKV**; prefer HLS / MPEG-TS when the panel offers them.
