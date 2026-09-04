import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEMO_CHANNELS, DEMO_EPG, DEMO_SOURCE, refreshDemoEpg } from '../lib/demoData'
import { parseM3U } from '../lib/m3u'
import { trackEvent } from '../lib/eventLogger'
import type {
  AppView,
  Channel,
  EpgProgram,
  PlayerState,
  PlaylistSource,
  UiPrefs,
} from '../types/iptv'

interface IptvState {
  onboarded: boolean
  view: AppView
  sources: PlaylistSource[]
  activeSourceId: string
  channels: Channel[]
  epg: EpgProgram[]
  favorites: string[]
  recentIds: string[]
  search: string
  selectedGroup: string | null
  player: PlayerState
  prefs: UiPrefs
  setView: (view: AppView) => void
  completeOnboarding: () => void
  setSearch: (q: string) => void
  setSelectedGroup: (group: string | null) => void
  toggleFavorite: (channelId: string) => void
  playChannel: (channelId: string) => void
  setPlayer: (patch: Partial<PlayerState>) => void
  loadDemo: () => void
  importM3UText: (name: string, text: string, epgUrl?: string) => void
  importM3UUrl: (name: string, url: string, epgUrl?: string) => Promise<void>
  removeSource: (id: string) => void
  setPrefs: (patch: Partial<UiPrefs>) => void
  refreshDemoGuide: () => void
}

const defaultPlayer: PlayerState = {
  channelId: null,
  paused: false,
  muted: false,
  volume: 0.9,
  overlayVisible: true,
  buffering: false,
  error: null,
}

const defaultPrefs: UiPrefs = {
  showClock: true,
  autoHideControlsMs: 4200,
  reduceMotion: false,
  guideHours: 5,
}

export const useIptvStore = create<IptvState>()(
  persist(
    (set, get) => ({
      onboarded: false,
      view: 'home',
      sources: [DEMO_SOURCE],
      activeSourceId: DEMO_SOURCE.id,
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
      favorites: ['live_aether_one', 'live_arena_sports'],
      recentIds: [],
      search: '',
      selectedGroup: null,
      player: defaultPlayer,
      prefs: defaultPrefs,

      setView: (view) => set({ view }),

      completeOnboarding: () => set({ onboarded: true, view: 'home' }),

      setSearch: (search) => {
        set({ search })
        void trackEvent('search_query', { query: search.slice(0, 120) })
      },

      setSelectedGroup: (selectedGroup) => set({ selectedGroup }),

      toggleFavorite: (channelId) =>
        set((s) => {
          const favored = !s.favorites.includes(channelId)
          void trackEvent('favorite_toggle', { channelId, favored })
          return {
            favorites: favored
              ? [...s.favorites, channelId]
              : s.favorites.filter((id) => id !== channelId),
          }
        }),

      playChannel: (channelId) =>
        set((s) => {
          if (s.player.channelId && s.player.channelId !== channelId) {
            void trackEvent('channel_switch', {
              fromChannelId: s.player.channelId,
              toChannelId: channelId,
            })
          }
          return {
            player: {
              ...s.player,
              channelId,
              paused: false,
              overlayVisible: true,
              error: null,
              buffering: true,
            },
            recentIds: [
              channelId,
              ...s.recentIds.filter((id) => id !== channelId),
            ].slice(0, 24),
            view: s.channels.find((c) => c.id === channelId)?.kind === 'live'
              ? 'live'
              : s.view === 'vod'
                ? 'vod'
                : 'live',
          }
        }),

      setPlayer: (patch) =>
        set((s) => ({ player: { ...s.player, ...patch } })),

      loadDemo: () =>
        set({
          sources: [DEMO_SOURCE],
          activeSourceId: DEMO_SOURCE.id,
          channels: DEMO_CHANNELS,
          epg: refreshDemoEpg(),
          onboarded: true,
          view: 'home',
        }),

      importM3UText: (name, text, epgUrl) => {
        const parsed = parseM3U(text)
        if (!parsed.length) throw new Error('No channels found in playlist')
        const source: PlaylistSource = {
          id: `m3u_${Date.now().toString(36)}`,
          name,
          type: 'm3u',
          epgUrl,
          createdAt: Date.now(),
        }
        set({
          sources: [...get().sources.filter((s) => s.type !== 'demo'), source],
          activeSourceId: source.id,
          channels: parsed,
          epg: [],
          onboarded: true,
          view: 'home',
          player: { ...defaultPlayer },
        })
      },

      importM3UUrl: async (name, url, epgUrl) => {
        const res = await fetch(url)
        if (!res.ok) throw new Error(`Playlist fetch failed (${res.status})`)
        const text = await res.text()
        const parsed = parseM3U(text)
        if (!parsed.length) throw new Error('No channels found in playlist')
        const source: PlaylistSource = {
          id: `m3u_${Date.now().toString(36)}`,
          name,
          type: 'm3u',
          url,
          epgUrl,
          createdAt: Date.now(),
        }
        set({
          sources: [...get().sources.filter((s) => s.type !== 'demo'), source],
          activeSourceId: source.id,
          channels: parsed,
          epg: [],
          onboarded: true,
          view: 'home',
          player: { ...defaultPlayer },
        })
      },

      removeSource: (id) => {
        const remaining = get().sources.filter((s) => s.id !== id)
        if (!remaining.length) {
          get().loadDemo()
          return
        }
        set({ sources: remaining, activeSourceId: remaining[0].id })
      },

      setPrefs: (patch) => set((s) => ({ prefs: { ...s.prefs, ...patch } })),

      refreshDemoGuide: () => {
        if (get().activeSourceId === 'demo') {
          set({ epg: refreshDemoEpg() })
        }
      },
    }),
    {
      name: 'aether-iptv-v2',
      partialize: (s) => ({
        onboarded: s.onboarded,
        favorites: s.favorites,
        recentIds: s.recentIds,
        prefs: s.prefs,
        sources: s.sources,
        activeSourceId: s.activeSourceId,
        // Persist demo or keep channels for m3u imports when small enough
        channels: s.channels.length < 500 ? s.channels : s.channels.slice(0, 500),
      }),
      merge: (persisted, current) => {
        const saved = (persisted ?? {}) as Partial<IptvState>
        const merged = { ...current, ...saved }
        // Always refresh demo pack channels/EPG so stream URL fixes apply.
        if (!saved.activeSourceId || saved.activeSourceId === 'demo') {
          merged.sources = [DEMO_SOURCE]
          merged.activeSourceId = DEMO_SOURCE.id
          merged.channels = DEMO_CHANNELS
          merged.epg = refreshDemoEpg()
        }
        return merged
      },
    },
  ),
)

export function selectLiveChannels(channels: Channel[]) {
  return channels.filter((c) => c.kind === 'live')
}

export function selectVod(channels: Channel[]) {
  return channels.filter((c) => c.kind === 'movie' || c.kind === 'series')
}

export function selectGroups(channels: Channel[]) {
  return [...new Set(channels.map((c) => c.group))].sort()
}
