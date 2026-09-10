# Fire Stick / lean-back remote (Aether)

Web remote layer lives in `src/lib/fireStickRemote.ts` + `src/App.tsx` + spatial focus in `src/lib/tvFocus.ts`. Browser keyboard simulation matches Fire Stick D-pad.

Live betting / sportsbook overlays are **deferred** — not part of this remote map.

## Remote map

| Fire Stick | Browser sim | Immersive (menu closed) | Overlay open |
| --- | --- | --- | --- |
| **D-pad ↑ / ↓** | `ArrowUp` / `ArrowDown` | Channel zap | Spatial focus (nav, chips, list) |
| **D-pad ← / →** | `ArrowLeft` / `ArrowRight` | Focus player chrome / volume scrub when chrome visible; else ignored | Spatial focus across rails / chips / controls |
| **Select / OK** | `Enter` | Opens Remote menu | Activates focused control |
| **Back** | `Escape` / `Backspace` | Hide chrome if shown; if already immersive → **no-op** (do not unload player) | Dismiss overlay → immersive TV |
| **Menu** | `ContextMenu` / Android `KEYCODE_MENU` (82) | Toggle overlay | Toggle overlay |
| **R** (dev/web) | `r` / `R` | Toggle overlay (same as Menu) | Toggle overlay |

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
2. Confirm Aether appears in Fire TV Apps (LEANBACK_LAUNCHER).
3. D-pad: focus rings move · OK opens menu · Back returns to immersive · ↑↓ zaps when immersive.

### Do not

- Require touchscreen.
- Force `leanback` required=`true` unless the APK is TV-only.
- Capture Back in immersive in a way that exits the activity on first press (web layer already `preventDefault`s; native WebView back may still need `onBackPressed` → inject Escape if the WebView consumes history).

## Tests

```bash
npm test -- src/lib/fireStickRemote.test.ts src/lib/tvFocus.test.ts
```

Manual: open the app, press `Escape` until immersive, then `Enter` (menu), arrows (focus rings), `Escape` (dismiss).
