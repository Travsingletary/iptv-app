import type { Channel, EpgProgram, ProgramReminder } from '../types/iptv.js'
import { findUpcomingPrograms } from './reminders.js'
import { suggestStreamFallbacks } from './streamFallback.js'

export type AutomationRuleKind =
  | 'buffering_fallback_suggest'
  | 'favorite_start_remind'
  | 'stream_error_auto_fallback'

export interface AutomationRule {
  id: string
  kind: AutomationRuleKind
  enabled: boolean
  label: string
  description: string
  /** Buffering threshold in seconds (buffering_fallback_suggest). */
  bufferingSeconds: number
  /** Minutes before favorite program start (favorite_start_remind). */
  leadMinutes: number
}

export type AutomationActionKind =
  | 'toast_fallback_suggest'
  | 'schedule_favorite_reminders'
  | 'auto_switch_fallback'
  | 'toast_info'

export interface AutomationAction {
  id: string
  ruleId: string
  kind: AutomationActionKind
  message: string
  channelId?: string
  channelName?: string
  reminders?: Array<{
    programId: string
    programTitle: string
    channelId: string
    channelName: string
    fireAt: number
  }>
  fallbackSuggestions?: Array<{
    channelId: string
    channelName: string
    reason: string
  }>
}

export interface AutomationSnapshot {
  now: number
  buffering: boolean
  bufferingStartedAt: number | null
  streamError: string | null
  channelId: string | null
  channels: Channel[]
  epg: EpgProgram[]
  favorites: string[]
  reminders: ProgramReminder[]
  /** Rule ids already fired for the current buffering / error episode. */
  firedEpisodeKeys: string[]
}

const STORAGE_KEY = 'aether_automation_rules_v1'

export const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'rule_buffering_fallback',
    kind: 'buffering_fallback_suggest',
    enabled: true,
    label: 'Suggest fallback when buffering',
    description: 'When buffering exceeds the threshold, suggest an alternate in the same group.',
    bufferingSeconds: 8,
    leadMinutes: 5,
  },
  {
    id: 'rule_favorite_remind',
    kind: 'favorite_start_remind',
    enabled: true,
    label: 'Remind before favorites start',
    description: 'Arm reminders ahead of upcoming programs on favorite channels.',
    bufferingSeconds: 8,
    leadMinutes: 5,
  },
  {
    id: 'rule_error_auto_fallback',
    kind: 'stream_error_auto_fallback',
    enabled: true,
    label: 'Auto-try alternate on stream error',
    description: 'If a live stream fatally errors, switch to another channel in the same group.',
    bufferingSeconds: 8,
    leadMinutes: 5,
  },
]

function canUseStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
}

export function loadAutomationRules(): AutomationRule[] {
  if (!canUseStorage()) return DEFAULT_AUTOMATION_RULES.map((r) => ({ ...r }))
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_AUTOMATION_RULES.map((r) => ({ ...r }))
    const parsed = JSON.parse(raw) as AutomationRule[]
    if (!Array.isArray(parsed) || !parsed.length) {
      return DEFAULT_AUTOMATION_RULES.map((r) => ({ ...r }))
    }
    // Merge with defaults so new rule kinds appear after upgrades.
    return DEFAULT_AUTOMATION_RULES.map((def) => {
      const saved = parsed.find((r) => r.id === def.id || r.kind === def.kind)
      return saved ? { ...def, ...saved, id: def.id, kind: def.kind } : { ...def }
    })
  } catch {
    return DEFAULT_AUTOMATION_RULES.map((r) => ({ ...r }))
  }
}

export function saveAutomationRules(rules: AutomationRule[]): void {
  if (!canUseStorage()) return
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(rules))
}

export function setRuleEnabled(
  rules: AutomationRule[],
  id: string,
  enabled: boolean,
): AutomationRule[] {
  return rules.map((r) => (r.id === id ? { ...r, enabled } : r))
}

export function updateRuleParams(
  rules: AutomationRule[],
  id: string,
  patch: Partial<Pick<AutomationRule, 'bufferingSeconds' | 'leadMinutes'>>,
): AutomationRule[] {
  return rules.map((r) => (r.id === id ? { ...r, ...patch } : r))
}

/**
 * Pure evaluator — returns actions for enabled rules that newly fire.
 */
export function evaluateAutomationRules(
  rules: AutomationRule[],
  snapshot: AutomationSnapshot,
): AutomationAction[] {
  const actions: AutomationAction[] = []
  const fired = new Set(snapshot.firedEpisodeKeys)

  for (const rule of rules) {
    if (!rule.enabled) continue

    if (rule.kind === 'buffering_fallback_suggest') {
      const episodeKey = `buf:${snapshot.channelId ?? 'none'}`
      if (fired.has(`${rule.id}:${episodeKey}`)) continue
      if (!snapshot.buffering || snapshot.bufferingStartedAt == null || !snapshot.channelId) {
        continue
      }
      const elapsedSec = (snapshot.now - snapshot.bufferingStartedAt) / 1000
      if (elapsedSec < rule.bufferingSeconds) continue
      const suggestions = suggestStreamFallbacks(snapshot.channelId, snapshot.channels, 3)
      if (!suggestions.length) continue
      actions.push({
        id: `act_${rule.id}_${snapshot.now}`,
        ruleId: rule.id,
        kind: 'toast_fallback_suggest',
        message: `Buffering > ${rule.bufferingSeconds}s — try an alternate?`,
        channelId: snapshot.channelId,
        fallbackSuggestions: suggestions.map((s) => ({
          channelId: s.channelId,
          channelName: s.channelName,
          reason: s.reason,
        })),
      })
    }

    if (rule.kind === 'favorite_start_remind') {
      const episodeKey = `fav:${Math.floor(snapshot.now / 60_000)}`
      if (fired.has(`${rule.id}:${episodeKey}`)) continue
      if (!snapshot.favorites.length) continue
      const leadMs = rule.leadMinutes * 60_000
      const drafts = []
      for (const favId of snapshot.favorites) {
        const channel = snapshot.channels.find((ch) => ch.id === favId)
        if (!channel) continue
        const upcoming = findUpcomingPrograms(
          channel.name,
          snapshot.channels,
          snapshot.epg,
          snapshot.now,
          2,
        ).filter((d) => d.channelId === favId && d.fireAt - snapshot.now <= leadMs + 60_000)
        for (const draft of upcoming) {
          const already = snapshot.reminders.some(
            (r) => !r.dismissed && r.programId === draft.programId,
          )
          if (already) continue
          drafts.push({
            ...draft,
            fireAt: Math.max(snapshot.now + 1_000, draft.fireAt - leadMs),
          })
        }
      }
      if (!drafts.length) continue
      actions.push({
        id: `act_${rule.id}_${snapshot.now}`,
        ruleId: rule.id,
        kind: 'schedule_favorite_reminders',
        message: `Armed ${drafts.length} favorite reminder(s) (${rule.leadMinutes} min lead).`,
        reminders: drafts.slice(0, 5),
      })
    }

    if (rule.kind === 'stream_error_auto_fallback') {
      const episodeKey = `err:${snapshot.channelId ?? 'none'}:${snapshot.streamError ?? ''}`
      if (fired.has(`${rule.id}:${episodeKey}`)) continue
      if (!snapshot.streamError || !snapshot.channelId) continue
      const current = snapshot.channels.find((ch) => ch.id === snapshot.channelId)
      if (!current || current.kind !== 'live') continue
      const suggestions = suggestStreamFallbacks(snapshot.channelId, snapshot.channels, 1)
      const pick = suggestions[0]
      if (!pick) continue
      actions.push({
        id: `act_${rule.id}_${snapshot.now}`,
        ruleId: rule.id,
        kind: 'auto_switch_fallback',
        message: `Stream error — switching to ${pick.channelName}.`,
        channelId: pick.channelId,
        channelName: pick.channelName,
        fallbackSuggestions: suggestions.map((s) => ({
          channelId: s.channelId,
          channelName: s.channelName,
          reason: s.reason,
        })),
      })
    }
  }

  return actions
}

export function episodeKeysForActions(
  actions: AutomationAction[],
  snapshot: AutomationSnapshot,
): string[] {
  const keys: string[] = []
  for (const action of actions) {
    const rule = action.ruleId
    if (action.kind === 'toast_fallback_suggest') {
      keys.push(`${rule}:buf:${snapshot.channelId ?? 'none'}`)
    } else if (action.kind === 'schedule_favorite_reminders') {
      keys.push(`${rule}:fav:${Math.floor(snapshot.now / 60_000)}`)
    } else if (action.kind === 'auto_switch_fallback') {
      keys.push(`${rule}:err:${snapshot.channelId ?? 'none'}:${snapshot.streamError ?? ''}`)
    }
  }
  return keys
}
