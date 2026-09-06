export type ContentKind = 'live' | 'movie' | 'series'

export interface Channel {
  id: string
  name: string
  logo?: string
  group: string
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
  type: 'demo' | 'm3u' | 'xtream'
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
  /** Effective URL being played (may be stub). */
  url: string
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
}
