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

export interface PlayerState {
  channelId: string | null
  paused: boolean
  muted: boolean
  volume: number
  overlayVisible: boolean
  buffering: boolean
  error: string | null
}

export type AppView = 'home' | 'live' | 'guide' | 'vod' | 'favorites' | 'settings'

export interface UiPrefs {
  showClock: boolean
  autoHideControlsMs: number
  reduceMotion: boolean
  guideHours: number
}
