export type ContentKind = 'live' | 'movie' | 'series'

export interface Channel {
  id: string
  name: string
  logo?: string
  /** Original provider group / category_name (kept for display + fallback). */
  group: string
  /**
   * Normalized browse bucket (News, Sports, Kids, …).
   * Derived from `group` (+ name) when missing; see `normalizeCategory`.
   */
  category?: string
  url: string
  kind: ContentKind
  tvgId?: string
  tvgName?: string
  favorite?: boolean
  catchup?: boolean
  quality?: string
  poster?: string
  backdrop?: string
  year?: number
  rating?: string
  description?: string
  /** Provider stream id (MegaOTT / Xtream) for timeshift URLs. */
  streamId?: string
  /** Hours of archive when panel advertises tv_archive_duration. */
  archiveDurationHours?: number
  /** Xtream/MegaOTT category_id for lazy VOD loads. */
  providerCategoryId?: string
  /** Container hint from panel (mp4, mkv, m3u8, ts). */
  containerExtension?: string
}

/** Lazy VOD/series category from MegaOTT / Xtream `get_*_categories`. */
export interface VodCategory {
  id: string
  name: string
  kind: 'movie' | 'series'
  /** Normalized browse bucket when useful. */
  normalized?: string
  parentId?: string
}

export interface EpgProgram {
  id: string
  channelId: string
  title: string
  description?: string
  start: number
  end: number
  category?: string
}

export interface PlaylistSource {
  id: string
  name: string
  type: 'demo' | 'm3u' | 'xtream' | 'megaott'
  url?: string
  username?: string
  password?: string
  epgUrl?: string
  createdAt: number
}

export interface StreamFallbackOption {
  channelId: string
  channelName: string
  reason: string
}

export interface CatchupState {
  active: boolean
  minutesAgo: number
  label: string
  /** Effective URL being played (may be stub or real timeshift). */
  url: string
  /** How catch-up was resolved. */
  mode?: 'xtream' | 'demo_stub' | 'unsupported'
}

export interface PlayerState {
  channelId: string | null
  paused: boolean
  muted: boolean
  volume: number
  overlayVisible: boolean
  buffering: boolean
  error: string | null
  /** One-tap alternates when the current stream fatally fails. */
  fallbackSuggestions: StreamFallbackOption[]
  /** Catch-up / timeshift overlay state. */
  catchup: CatchupState | null
  /** Multi-view mosaic slot channel ids (2 or 4). */
  multiViewIds: string[]
  multiViewLayout: 1 | 2 | 4
  /** Bumped by retryPlayback to force VideoPlayer remount of the same URL. */
  playbackNonce: number
}

export interface ProgramReminder {
  id: string
  programId: string
  programTitle: string
  channelId: string
  channelName: string
  fireAt: number
  createdAt: number
  fired: boolean
  dismissed: boolean
}

export type AppView = 'home' | 'live' | 'guide' | 'vod' | 'favorites' | 'settings' | 'multiview'

export interface UiPrefs {
  showClock: boolean
  autoHideControlsMs: number
  reduceMotion: boolean
  guideHours: number
  /** Accessibility: bump base font size across the shell. */
  largeText: boolean
  /** Accessibility: stronger gold/white contrast on black. */
  highContrast: boolean
}
