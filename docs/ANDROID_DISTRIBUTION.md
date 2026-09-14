# Android / Downloader distribution (SteadyStream)

Sideload SteadyStream onto Fire Stick and Android phones the classic IPTV way: host an APK on an HTTPS URL, then install it with the **Downloader** app.

Live betting / sportsbook overlays are **not implemented** — deferred to a future release. Do not expect betting UI in this APK.

## 1. Build the APK

Requires Node 20+, JDK 17+ (21 works), and Android SDK (platform 36 + build-tools).

```bash
npm install
# Point Gradle at your SDK once:
echo "sdk.dir=$ANDROID_HOME" > android/local.properties   # or ~/Library/Android/sdk on macOS

npm run android:apk
```

What that runs:

1. `npm run build` — Vite production bundle into `dist/`
2. `npx cap sync android` — copy web assets into the Capacitor project
3. `./android/gradlew -p android assembleDebug` — debug-signed APK

**Output path:**

```text
android/app/build/outputs/apk/debug/app-debug.apk
```

App id: `tv.aether.player` · Display name: **SteadyStream**

### Release signing (later)

Debug APKs are fine for friends. For a longer-lived share:

```bash
# Create a keystore once (keep it OUT of git)
keytool -genkey -v -keystore aether-release.jks -keyalg RSA -keysize 2048 -validity 10000 -alias aether

# Configure signing in android/app/build.gradle (signingConfigs.release)
# then:
npm run build && npx cap sync android
./android/gradlew -p android assembleRelease
# → android/app/build/outputs/apk/release/app-release.apk
```

Never commit `.jks` / `.keystore` files or passwords.

## 2. Hosted APK URL (Downloader)

**Current debug build** (SteadyStream · `tv.aether.player` · leanback):

```text
https://github.com/Travsingletary/iptv-app/releases/download/steadystream-v1.0.0-debug/SteadyStream-debug.apk
```

Release page: https://github.com/Travsingletary/iptv-app/releases/tag/steadystream-v1.0.0-debug

### Short URL (verified)

Typing the full GitHub Releases URL on a Fire Stick remote is painful. Use this verified short link instead (all lowercase):

```text
https://tinyurl.com/2c55b9lc
```

In **Downloader**, enter either `tinyurl.com/2c55b9lc` or the full `https://…` form above → **Go**. It 301s to the SteadyStream APK (verified Sep 2026).

### Downloader numeric code (best UX — create once)

**No verified SteadyStream numeric code yet.** Official Downloader short codes are issued only by the AFTVnews URL Shortener at [go.aftvnews.com](https://go.aftvnews.com/). There is **no public API**; creation requires a human reCAPTCHA in a browser (about 2 minutes). Do not invent or paste an unverified number.

**How codes work (2026):**

1. You submit any HTTPS destination URL at [go.aftvnews.com](https://go.aftvnews.com/).
2. After reCAPTCHA, AFTVnews stores a mapping and returns a **digits-only** code (e.g. `12345`) plus `aftv.news/12345`.
3. The Downloader app (by AFTVnews) recognizes a pure-numeric entry, looks it up via that shortener, and loads the stored URL — so friends never type `.` or `/`.

**Create a SteadyStream code yourself:**

1. On a phone or computer, open **https://go.aftvnews.com/**
2. Paste the APK URL (prefer the TinyURL above, or the long GitHub Releases URL).
3. Check **I’m not a robot**, complete the captcha, click **Shorten**.
4. Copy the large **numeric code** shown (and optionally `aftv.news/<code>`).
5. On Fire Stick → Downloader → type **only the digits** → **Go**.
6. Replace the placeholder below in this doc / README once you have verified the code downloads SteadyStream.

```text
Downloader code: (pending — generate at go.aftvnews.com; do not invent)
```

Submitted URLs on go.aftvnews.com are **public** (anyone who guesses digits can open them). Fine for a public APK; do not shorten private/signed links.

To re-host after a rebuild:

| Host | Notes |
| --- | --- |
| **GitHub Releases** (preferred) | `gh release upload steadystream-v1.0.0-debug SteadyStream-debug.apk --clobber` or create a new tag |
| **Cloudflare R2** / S3 / GCS | Public object URL or signed URL |
| **Any static HTTPS** | Must end in `.apk` or set `Content-Type: application/vnd.android.package-archive` |

Fire Stick Downloader needs a plain HTTPS URL (or an AFTVnews numeric code that resolves to one). Avoid pages that require clicking “download” after a captcha.

## 3. Friends install via Downloader

### Fire Stick / Fire TV

1. Settings → My Fire TV → Developer options → turn **Apps from Unknown Sources** / **Installer** on for Downloader (wording varies by firmware).
2. Get **Downloader** from the Amazon Appstore (silk browser → search “Downloader” if needed).
3. Open Downloader → enter **one of**:
   - the **numeric Downloader code** (once generated at go.aftvnews.com), or
   - `tinyurl.com/2c55b9lc`, or
   - the full GitHub Releases APK URL  
   → **Go**.
4. When the file finishes, tap **Install** → **Open**.
5. Launch **SteadyStream** from Apps. Enter MegaOTT / M3U in Settings on the device (credentials stay local).

### Android phone / tablet

1. Settings → allow install from unknown apps for **Downloader** (or Chrome / Files).
2. Same Downloader flow (or open the APK URL in Chrome and install).
3. Open SteadyStream → connect playlist in Settings.

## 4. Fire Stick vs phone differences

| | Fire Stick / Fire TV | Phone / tablet |
| --- | --- | --- |
| Input | D-pad / remote (`R` remote FAB, ↑↓ zap) | Touch + remote FAB |
| Sideload | Downloader + unknown sources | Downloader or browser |
| PWA install | Not useful on Fire OS | Possible in Chrome, but **APK is preferred** for IPTV |
| Leanback | App registers `LEANBACK_LAUNCHER` | Standard launcher icon |

Progressive Web App “Add to Home Screen” on Fire TV is usually insufficient (no reliable store-like install, limited offline packaging). Ship the **APK**.

## 5. Caveats

- **Unknown sources** — friends must explicitly allow sideloading; this is normal for IPTV apps.
- **Credentials** — MegaOTT username/password and M3U URLs stay in device storage (`localStorage` in the WebView). Do not put secrets in the APK, README, or GitHub Release notes.
- **`max_connections=1`** — many MegaOTT panels allow only one concurrent stream. Disable auto-alternate-on-error in Settings or a second stream can kick the first.
- **Cleartext HTTP** — the Android wrapper allows `http://` portals (common for Xtream/MegaOTT). Prefer HTTPS when the panel supports it.
- **Assistant Live AI** — needs a reachable `/api/assistant` with `OPENAI_API_KEY`, or client fallback keys. The packaged APK ships the SPA only; Mock AI works offline of the API. Point friends at demo pack first if you have not hosted the companion server.
- **Updates** — bump `versionCode` / `versionName` in `android/app/build.gradle`, rebuild, re-host the APK; friends re-download via Downloader.
- **Legal** — bring-your-own legal playlist / provider credentials.

## Dev / demo without APK

For quick browser sharing (not Fire Stick):

```bash
npm run dev          # local LAN URL (host: true)
# or
npm run build && npm run start:api   # serves dist + /api/assistant
```

Share the machine’s LAN URL only on the same network, or deploy the static `dist/` (plus optional API) to any preview host. For friends on Fire Stick, use the **hosted APK URL** path above.

## Related

- Capacitor config: `capacitor.config.ts` (`appId` `tv.aether.player`)
- Scripts: `npm run android:sync`, `npm run android:apk`, `npm run android:open`
