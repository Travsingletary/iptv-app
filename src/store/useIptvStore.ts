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
  ProgramReminder,
  UiPrefs,
} from '../types/iptv'
import {
  createReminder,
  dismissReminder as dismissReminderPure,
  loadReminders,
  markDueReminders,
  saveReminders,
  type ReminderDraft,
} from '../lib/reminders'
import { syncRemindersToSupabase } from '../lib/reminderSync'
import { suggestStreamFallbacks } from '../lib/streamFallback'
import {
  evaluateAutomationRules,
  episodeKeysForActions,
  loadAutomationRules,
  saveAutomationRules,
  setRuleEnabled as setRuleEnabledPure,
  updateRuleParams as updateRuleParamsPure,
  type AutomationAction,
  type AutomationRule,
} from '../lib/automationRules'

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
  reminders: ProgramReminder[]
  reminderToasts: ProgramReminder[]
  automationRules: AutomationRule[]
  automationToasts: AutomationAction[]
  bufferingStartedAt: number | null
  automationFiredKeys: string[]
  setView: (view: AppView) => void
  completeOnboarding: () => void
  setSearch: (q: string) => void
  setSelectedGroup: (group: string | null) => void
  toggleFavorite: (channelId: string) => void
  playChannel: (channelId: string) => void
  setPlayer: (patch: Partial<PlayerState>) => void
  setStreamError: (message: string) => void
  loadDemo: () => void
  importM3UText: (name: string, text: string, epgUrl?: string) => void
  importM3UUrl: (name: string, url: string, epgUrl?: string) => Promise<void>
  removeSource: (id: string) => void
  setPrefs: (patch: Partial<UiPrefs>) => void
  refreshDemoGuide: () => void
  addReminder: (draft: ReminderDraft) => ProgramReminder
  dismissReminder: (id: string) => void
  clearAllReminders: () => void
  clearReminderToast: (id: string) => void
  tickReminders: (now?: number) => void
  setAutomationRuleEnabled: (id: string, enabled: boolean) => void
  setAutomationRuleParams: (
    id: string,
    patch: Partial<Pick<AutomationRule, 'bufferingSeconds' | 'leadMinutes'>>,
  ) => void
  clearAutomationToast: (id: string) => void
  tickAutomation: (now?: number) => void
}

const defaultPlayer: PlayerState = {
  channelId: null,
  paused: false,
  muted: false,
  volume: 0.9,
  overlayVisible: true,
  buffering: false,
  error: null,
  fallbackSuggestions: [],
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
      reminders: loadReminders(),
      reminderToasts: [],
      automationRules: loadAutomationRules(),
      automationToasts: [],
      bufferingStartedAt: null,
      automationFiredKeys: [],

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
              fallbackSuggestions: [],
            },
            bufferingStartedAt: Date.now(),
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
        set((s) => {
          let bufferingStartedAt = s.bufferingStartedAt
          if (typeof patch.buffering === 'boolean') {
            if (patch.buffering && !s.player.buffering) {
              bufferingStartedAt = Date.now()
            } else if (!patch.buffering) {
              bufferingStartedAt = null
            }
          }
          return { player: { ...s.player, ...patch }, bufferingStartedAt }
        }),

      setStreamError: (message) =>
        set((s) => {
          const channelId = s.player.channelId
          const fallbackSuggestions = channelId
            ? suggestStreamFallbacks(channelId, s.channels, 3).map((item) => ({
                channelId: item.channelId,
                channelName: item.channelName,
                reason: item.reason,
              }))
            : []
          return {
            bufferingStartedAt: null,
            player: {
              ...s.player,
              buffering: false,
              overlayVisible: true,
              error: message,
              fallbackSuggestions,
            },
          }
        }),

      addReminder: (draft) => {
        const reminder = createReminder(draft)
        set((s) => {
          const reminders = [...s.reminders.filter((r) => !r.dismissed), reminder].slice(-80)
          saveReminders(reminders)
          void syncRemindersToSupabase(reminders)
          return { reminders }
        })
        return reminder
      },

      dismissReminder: (id) =>
        set((s) => {
          const reminders = dismissReminderPure(s.reminders, id)
          saveReminders(reminders)
          void syncRemindersToSupabase(reminders)
          return {
            reminders,
            reminderToasts: s.reminderToasts.filter((t) => t.id !== id),
          }
        }),

      clearAllReminders: () =>
        set((s) => {
          const reminders = s.reminders.map((r) => ({ ...r, dismissed: true }))
          saveReminders(reminders)
          void syncRemindersToSupabase(reminders)
          return { reminders, reminderToasts: [] }
        }),

      clearReminderToast: (id) =>
        set((s) => ({
          reminderToasts: s.reminderToasts.filter((t) => t.id !== id),
        })),

      tickReminders: (now = Date.now()) =>
        set((s) => {
          const { next, newlyFired } = markDueReminders(s.reminders, now)
          if (!newlyFired.length) return s
          saveReminders(next)
          void syncRemindersToSupabase(next)
          return {
            reminders: next,
            reminderToasts: [...newlyFired, ...s.reminderToasts].slice(0, 5),
          }
        }),

      setAutomationRuleEnabled: (id, enabled) =>
        set((s) => {
          const automationRules = setRuleEnabledPure(s.automationRules, id, enabled)
          saveAutomationRules(automationRules)
          return { automationRules }
        }),

      setAutomationRuleParams: (id, patch) =>
        set((s) => {
          const automationRules = updateRuleParamsPure(s.automationRules, id, patch)
          saveAutomationRules(automationRules)
          return { automationRules }
        }),

      clearAutomationToast: (id) =>
        set((s) => ({
          automationToasts: s.automationToasts.filter((t) => t.id !== id),
        })),

      tickAutomation: (now = Date.now()) =>
        set((s) => {
          const actions = evaluateAutomationRules(s.automationRules, {
            now,
            buffering: s.player.buffering,
            bufferingStartedAt: s.bufferingStartedAt,
            streamError: s.player.error,
            channelId: s.player.channelId,
            channels: s.channels,
            epg: s.epg,
            favorites: s.favorites,
            reminders: s.reminders,
            firedEpisodeKeys: s.automationFiredKeys,
          })
          if (!actions.length) return s

          const keys = episodeKeysForActions(actions, {
            now,
            buffering: s.player.buffering,
            bufferingStartedAt: s.bufferingStartedAt,
            streamError: s.player.error,
            channelId: s.player.channelId,
            channels: s.channels,
            epg: s.epg,
            favorites: s.favorites,
            reminders: s.reminders,
            firedEpisodeKeys: s.automationFiredKeys,
          })

          let reminders = s.reminders
          let player = s.player
          let channelSwitched: string | null = null

          for (const action of actions) {
            if (action.kind === 'schedule_favorite_reminders' && action.reminders?.length) {
              for (const draft of action.reminders) {
                const exists = reminders.some(
                  (r) => !r.dismissed && r.programId === draft.programId,
                )
                if (exists) continue
                reminders = [...reminders, createReminder(draft)].slice(-80)
              }
              saveReminders(reminders)
              void syncRemindersToSupabase(reminders)
            }
            if (action.kind === 'toast_fallback_suggest' && action.fallbackSuggestions?.length) {
              player = {
                ...player,
                overlayVisible: true,
                fallbackSuggestions: action.fallbackSuggestions,
              }
            }
            if (action.kind === 'auto_switch_fallback' && action.channelId) {
              channelSwitched = action.channelId
            }
          }

          const next: Partial<IptvState> = {
            reminders,
            player,
            automationFiredKeys: [...s.automationFiredKeys, ...keys].slice(-40),
            automationToasts: [...actions, ...s.automationToasts].slice(0, 5),
          }

          // Apply auto-switch outside this set via playChannel to keep telemetry consistent.
          if (channelSwitched) {
            queueMicrotask(() => {
              get().playChannel(channelSwitched!)
            })
          }

          return next
        }),

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
