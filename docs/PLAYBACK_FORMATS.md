# Playback format support

SteadyStream plays streams in the **browser / Capacitor WebView**. That is not the same as ExoPlayer or VLC on Android.

## Matrix

| Container | Extensions | Web / WebView                         | Notes                                                                                                                                   |
| --------- | ---------- | ------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| HLS       | `.m3u8`    | **Supported** (HLS.js; Safari native) | Preferred for live + adaptive VOD. Highest quality variant is preferred when the manifest lists multiple levels (HD/4K not downscaled). |
| MPEG-TS   | `.ts`      | **Supported** (mpegts.js MSE)         | Common for Xtream/MegaOTT live URLs ending in `.ts`.                                                                                    |
| MP4       | `.mp4`     | **Supported** (native `<video>`)      | Best-effort; needs H.264/AAC (or browser-supported codecs).                                                                             |
| WebM      | `.webm`    | **Supported** (native)                | VP8/VP9 + Opus/Vorbis when the browser allows.                                                                                          |
| MOV       | `.mov`     | Best-effort native                    | Often fails unless H.264 baseline.                                                                                                      |
| MKV       | `.mkv`     | **Unsupported** in Chromium           | Clear in-app error. Prefer MP4/HLS from the panel. Native ExoPlayer/VLC would be required on Android — **not** in this web build.       |
| AVI       | `.avi`     | **Unsupported**                       | Clear in-app error. Prefer MP4/HLS.                                                                                                     |

Source of truth for detection helpers: `src/lib/playback.ts` (+ unit tests).

## HD / 4K

- The player does **not** intentionally downscale.
- CSS uses `object-contain` on a full-bleed canvas (letterbox if needed).
- For HLS multi-variant manifests, SteadyStream pins the **highest bitrate / resolution** level after `MANIFEST_PARSED`.

## Smooth zap

- The `<video>` element is reused across channel changes.
- Engines (HLS.js / mpegts.js) are torn down without wiping the last decoded frame, reducing black flashes between zaps.
- Buffering and errors surface in an always-visible HUD with **Retry**.

## Android Capacitor note

The Capacitor Android shell embeds this same WebView player. MKV/AVI remain unsupported until a native player plugin (ExoPlayer / VLC) is added. Friends on Fire Stick should prefer HLS/MP4 titles from the provider.
