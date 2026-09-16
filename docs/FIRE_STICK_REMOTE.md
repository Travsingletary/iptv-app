# Fire Stick / lean-back remote (SteadyStream)

Web remote layer lives in `src/lib/fireStickRemote.ts` + `src/App.tsx` + spatial focus in `src/lib/tvFocus.ts`. Channel surfing helpers live in `src/lib/channelSurfing.ts` + `src/lib/surfingControls.ts`. Browser keyboard simulation matches Fire Stick D-pad.

Live betting / sportsbook overlays are **deferred** — not part of this remote map.

## Remote map

| Fire Stick | Browser sim | Immersive (menu closed) | Overlay open |
| --- | --- | --- | --- |
| **D-pad ↑ / ↓** | `ArrowUp` / `ArrowDown` | Channel zap (OSD + debounced tune) | Spatial focus (nav, chips, list) |
| **D-pad ← / →** | `ArrowLeft` / `ArrowRight` | Focus player chrome / volume scrub when chrome visible; else ignored | Spatial focus across rails / chips / controls |
| **Select / OK** | `Enter` | Opens **Live channel side panel** over video (TiviMate-like); commits digit entry if number pad active | Activates focused control |
| **Back** | `Escape` / `Backspace` | Hide chrome if shown; cancel digit entry; if already immersive → **no-op** (do not unload player) | Dismiss overlay → immersive TV |
| **0–9** | Digit keys | Number-pad LCN / index entry (overlay + auto-commit ~1.2s) | Typed into focused text fields only |
| **Menu** | `ContextMenu` / Android `KEYCODE_MENU` (82) | Toggle overlay | Toggle overlay |
| **R** (dev/web) | `r` / `R` | Toggle overlay (same as Menu) | Toggle overlay |

## Channel surfing

Designed for fast lean-back zapping without slamming a single concurrent connection:

1. **Zap OSD** — ↑↓ while immersive shows a brief bottom banner (`data-testid="zap-osd"`) with channel #, name, logo, and now/next when EPG is known. Auto-hides ~2.5s. Does not block video (`pointer-events-none`).
2. **Debounced tune** — rapid ↑↓ updates the OSD / Live “on air” highlight immediately; the stream URL only tunes after ~280ms idle so intermediate channels are skipped.
3. **Number pad** — digits build an overlay (`data-testid="channel-number-overlay"`); timeout or OK commits to matching LCN (`Channel.number` / Xtream `num` / M3U `tvg-chno`) or 1-based live index.
4. **Recents / favorites strip** — Live rail hop chips (`data-testid="surfing-hop-strip"`) for last-watched and favorites.
5. **Stable video canvas** — Shell keeps a single `VideoPlayer` mounted; zaps change stream URL only (soft teardown keeps the last frame).

Always-visible ember focus rings: `src/index.css` (`button:focus`, `[data-tv-focus]:focus`, …).

Remote FAB (`data-testid="remote-toggle"`) and Back-to-TV (`data-testid="remote-back"`) are in the spatial focus set.

## Capacitor / Android TV leanback (packaging agent)

When `android/` is generated via Capacitor, wire leanback so Fire Stick / Android TV can launch without a touchscreen.

### `android/app/src/main/AndroidManifest.xml`

Inside the main `<activity>` (Capacitor `MainActivity`):

1. Keep landscape (TV):

```xml
android:screenOrientation="landscape"
```

2. Launcher + leanback intents:

```xml
<intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
    <category android:name="android.intent.category.LEANBACK_LAUNCHER" />
</intent-filter>
```

3. In the root `<manifest>` (outside activity):

```xml
<uses-feature android:name="android.hardware.touchscreen" android:required="false" />
<uses-feature android:name="android.software.leanback" android:required="false" />
```

`leanback` required=`false` keeps phone installs working while still appearing under Fire TV Apps.

### Optional banner

Add `android:banner="@drawable/…"` on the application/activity for the Android TV launcher row.

### Verify on device

1. Sideload APK (see `docs/ANDROID_DISTRIBUTION.md`).
2. Confirm SteadyStream appears in Fire TV Apps (LEANBACK_LAUNCHER).
3. D-pad: focus rings move · OK opens Live channel side panel · Back returns to immersive · ↑↓ zaps when immersive · 0–9 enters channel number.

### Do not

- Require touchscreen.
- Force `leanback` required=`true` unless the APK is TV-only.
- Capture Back in immersive in a way that exits the activity on first press (web layer already `preventDefault`s; native WebView back may still need `onBackPressed` → inject Escape if the WebView consumes history).

## Tests

```bash
npm test -- src/lib/fireStickRemote.test.ts src/lib/tvFocus.test.ts src/lib/channelSurfing.test.ts
AETHER_URL=http://127.0.0.1:5173 node e2e/verify-firestick-remote.mjs
AETHER_URL=http://127.0.0.1:5173 npm run verify:channel-surfing
```

Manual: open the app, press `Escape` until immersive, then `Enter` (menu), arrows (focus rings), `Escape` (dismiss), ↑↓ (zap OSD), digits (number pad).
