import type { CapacitorConfig } from '@capacitor/cli'

/**
 * Capacitor wraps the Vite `dist/` SPA in a native Android WebView.
 * Build web first (`npm run build`), then `npx cap sync android`.
 */
const config: CapacitorConfig = {
  appId: 'tv.aether.player',
  appName: 'SteadyStream',
  webDir: 'dist',
  server: {
    // IPTV panels often use plain http://host:port — allow cleartext in WebView.
    androidScheme: 'https',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#000000',
  },
}

export default config
