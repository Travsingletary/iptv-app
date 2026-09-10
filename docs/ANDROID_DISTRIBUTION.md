# Android / Downloader distribution (Aether)

Sideload Aether onto Fire Stick and Android phones the classic IPTV way: host an APK on an HTTPS URL, then install it with the **Downloader** app.

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

App id: `tv.aether.player` · Display name: **Aether**

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

## 2. Host the APK on any HTTPS URL

Upload `app-debug.apk` (or the release APK) somewhere friends can reach without login walls if possible:

| Host | Notes |
| --- | --- |
| **GitHub Releases** | Attach the APK to a release; copy the asset download URL |
| **Cloudflare R2** / S3 / GCS | Public object URL or signed URL |
| **Any static HTTPS** | Must end in `.apk` or set `Content-Type: application/vnd.android.package-archive` |

Example (conceptual):

```text
https://example.com/aether/aether-debug.apk
```

Fire Stick Downloader needs a plain HTTPS URL. Avoid pages that require clicking “download” after a captcha.

## 3. Friends install via Downloader

### Fire Stick / Fire TV

1. Settings → My Fire TV → Developer options → turn **Apps from Unknown Sources** / **Installer** on for Downloader (wording varies by firmware).
2. Get **Downloader** from the Amazon Appstore (silk browser → search “Downloader” if needed).
3. Open Downloader → enter the **full HTTPS APK URL** → Go.
4. When the file finishes, tap **Install** → **Open**.
5. Launch **Aether** from Apps. Enter MegaOTT / M3U in Settings on the device (credentials stay local).

Tip: Downloader can remember a short numeric code if you use its code feature with a hosted URL mapping — optional; a pasted URL is enough.

### Android phone / tablet

1. Settings → allow install from unknown apps for **Downloader** (or Chrome / Files).
2. Same Downloader flow (or open the APK URL in Chrome and install).
3. Open Aether → connect playlist in Settings.

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
