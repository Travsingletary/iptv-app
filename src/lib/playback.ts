/**
 * Playback URL detection + format support matrix for SteadyStream.
 * WebView / Chromium capabilities differ from native Android (ExoPlayer / VLC).
 */

export type StreamContainer =
  'hls' | 'mpegts' | 'mp4' | 'webm' | 'ogg' | 'mov' | 'mkv' | 'avi' | 'unknown'

export type PlaybackSupport = 'native' | 'mse-hls' | 'mse-mpegts' | 'unsupported'

export interface FormatSupportRow {
  container: StreamContainer
  extensions: string[]
  web: PlaybackSupport
  note: string
  androidNativeHint?: string
}

/** Honest matrix for README / Settings / player UX. */
export const FORMAT_SUPPORT_MATRIX: FormatSupportRow[] = [
  {
    container: 'hls',
    extensions: ['.m3u8'],
    web: 'mse-hls',
    note: 'HLS.js (or Safari native). Preferred for adaptive live/VOD.',
  },
  {
    container: 'mpegts',
    extensions: ['.ts'],
    web: 'mse-mpegts',
    note: 'mpegts.js MSE live playback for raw MPEG-TS live URLs.',
  },
  {
    container: 'mp4',
    extensions: ['.mp4'],
    web: 'native',
    note: 'Native <video> progressive / fMP4 when codecs are H.264/AAC.',
  },
  {
    container: 'webm',
    extensions: ['.webm'],
    web: 'native',
    note: 'Native <video> when VP8/VP9 + Opus/Vorbis.',
  },
  {
    container: 'ogg',
    extensions: ['.ogg', '.ogv'],
    web: 'native',
    note: 'Limited browser support; try if labeled.',
  },
  {
    container: 'mov',
    extensions: ['.mov'],
    web: 'native',
    note: 'Best-effort native; often fails unless H.264 baseline.',
  },
  {
    container: 'mkv',
    extensions: ['.mkv'],
    web: 'unsupported',
    note: 'Chromium cannot demux Matroska in <video>. Prefer MP4/HLS from the panel.',
    androidNativeHint:
      'Capacitor WebView shares this limit. For MKV on Android, use ExoPlayer or VLC via a native plugin — not shipped in this web build.',
  },
  {
    container: 'avi',
    extensions: ['.avi'],
    web: 'unsupported',
    note: 'AVI is not playable in modern browsers. Prefer MP4/HLS.',
    androidNativeHint: 'Same as MKV — needs a native player, not WebView.',
  },
]

function pathnameOf(url: string): string {
  try {
    return new URL(url, 'http://local').pathname.toLowerCase()
  } catch {
    return url.toLowerCase()
  }
}

/** Detect container from URL path (query ignored). */
export function detectStreamContainer(url: string): StreamContainer {
  const path = pathnameOf(url)
  if (path.endsWith('.m3u8') || /\.m3u8$/i.test(path)) return 'hls'
  if (path.endsWith('.mkv')) return 'mkv'
  if (path.endsWith('.avi')) return 'avi'
  if (path.endsWith('.mp4')) return 'mp4'
  if (path.endsWith('.webm')) return 'webm'
  if (path.endsWith('.ogg') || path.endsWith('.ogv')) return 'ogg'
  if (path.endsWith('.mov')) return 'mov'
  // Raw .ts (not .m3u8) — MPEG-TS live
  if (path.endsWith('.ts')) return 'mpegts'
  // MegaOTT / Xtream live often omits extension; treat as HLS-capable until probed
  if (/\/live\//i.test(url) || /\/movie\//i.test(url) || /\/series\//i.test(url)) {
    return 'hls'
  }
  return 'unknown'
}

export function isMpegTsUrl(url: string): boolean {
  return detectStreamContainer(url) === 'mpegts'
}

export function isProgressiveUrl(url: string): boolean {
  const c = detectStreamContainer(url)
  return c === 'mp4' || c === 'webm' || c === 'ogg' || c === 'mov'
}

export function isMatroskaUrl(url: string): boolean {
  return detectStreamContainer(url) === 'mkv'
}

export function isAviUrl(url: string): boolean {
  return detectStreamContainer(url) === 'avi'
}

export function isHlsUrl(url: string): boolean {
  const c = detectStreamContainer(url)
  return c === 'hls' || c === 'unknown'
}

export function supportForContainer(container: StreamContainer): FormatSupportRow | undefined {
  return FORMAT_SUPPORT_MATRIX.find((row) => row.container === container)
}

/** User-facing error when the browser cannot play this container. */
export function unsupportedFormatMessage(url: string): string | null {
  const container = detectStreamContainer(url)
  if (container === 'mkv') {
    return 'This title is Matroska (.mkv). The browser cannot play it — try an MP4/HLS source. On Android, native ExoPlayer/VLC would be required.'
  }
  if (container === 'avi') {
    return 'This title is AVI. Browsers cannot play AVI — use an MP4 or HLS version from your provider.'
  }
  return null
}

export interface HlsLevelLike {
  bitrate?: number
  width?: number
  height?: number
}

/**
 * Prefer the highest quality variant (bitrate, then resolution).
 * Does not downscale — SteadyStream keeps HD/4K when the manifest offers it.
 */
export function pickHighestQualityLevelIndex(levels: HlsLevelLike[]): number {
  if (!levels.length) return -1
  let best = 0
  let bestScore = -1
  for (let i = 0; i < levels.length; i++) {
    const level = levels[i]
    const bitrate = level.bitrate ?? 0
    const pixels = (level.width ?? 0) * (level.height ?? 0)
    const score = bitrate > 0 ? bitrate : pixels
    if (score >= bestScore) {
      bestScore = score
      best = i
    }
  }
  return best
}

/** HLS.js config tuned for live zap + high starting quality preference. */
export function hlsPlayerConfig(isLive: boolean) {
  return {
    enableWorker: true,
    lowLatencyMode: isLive,
    backBufferLength: isLive ? 30 : 90,
    // Prefer higher bandwidth estimates so ABR does not cling to low rungs.
    abrEwmaDefaultEstimate: 8_000_000,
    abrBandWidthFactor: 0.95,
    abrBandWidthUpFactor: 0.7,
    maxBufferLength: isLive ? 20 : 60,
    // startLevel -1 = auto until MANIFEST_PARSED; we then pin highest.
    startLevel: -1,
  }
}

/**
 * Apply highest-quality preference after manifest parse.
 * Call with hls instance + levels from MANIFEST_PARSED.
 */
export function applyHighestQualityPreference(
  hls: {
    startLevel: number
    currentLevel: number
    loadLevel: number
    nextLevel?: number
  },
  levels: HlsLevelLike[],
): number {
  const idx = pickHighestQualityLevelIndex(levels)
  if (idx < 0) return -1
  hls.startLevel = idx
  hls.currentLevel = idx
  hls.loadLevel = idx
  if (typeof hls.nextLevel === 'number') hls.nextLevel = idx
  return idx
}
