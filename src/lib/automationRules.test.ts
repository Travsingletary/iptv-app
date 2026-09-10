import { describe, expect, it } from 'vitest'
import {
  DEFAULT_AUTOMATION_RULES,
  episodeKeysForActions,
  evaluateAutomationRules,
  setRuleEnabled,
  type AutomationSnapshot,
} from './automationRules'
import { DEMO_CHANNELS, DEMO_EPG } from './demoData'

function snapshot(overrides: Partial<AutomationSnapshot> = {}): AutomationSnapshot {
  return {
    now: Date.now(),
    buffering: false,
    bufferingStartedAt: null,
    streamError: null,
    channelId: 'live_aether_one',
    channels: DEMO_CHANNELS,
    epg: DEMO_EPG,
    favorites: ['live_arena_sports'],
    reminders: [],
    firedEpisodeKeys: [],
    ...overrides,
  }
}

describe('automationRules', () => {
  it('suggests fallback after buffering threshold', () => {
    const rules = DEFAULT_AUTOMATION_RULES.map((r) => ({ ...r }))
    const now = 1_000_000
    const actions = evaluateAutomationRules(rules, snapshot({
      now,
      buffering: true,
      bufferingStartedAt: now - 10_000,
      channelId: 'live_aether_one',
    }))
    const toast = actions.find((a) => a.kind === 'toast_fallback_suggest')
    expect(toast).toBeTruthy()
    expect(toast?.fallbackSuggestions?.length).toBeGreaterThan(0)
  })

  it('does not fire buffering rule when disabled', () => {
    const rules = setRuleEnabled(DEFAULT_AUTOMATION_RULES, 'rule_buffering_fallback', false)
    const now = 1_000_000
    const actions = evaluateAutomationRules(rules, snapshot({
      now,
      buffering: true,
      bufferingStartedAt: now - 20_000,
    }))
    expect(actions.some((a) => a.kind === 'toast_fallback_suggest')).toBe(false)
  })

  it('auto-switches on live stream error', () => {
    const actions = evaluateAutomationRules(DEFAULT_AUTOMATION_RULES, snapshot({
      streamError: 'Stream error. Try another channel.',
      channelId: 'live_aether_one',
    }))
    const auto = actions.find((a) => a.kind === 'auto_switch_fallback')
    expect(auto?.channelId).toBeTruthy()
    expect(auto?.channelId).not.toBe('live_aether_one')
  })

  it('does not auto-switch or suggest fallback for VOD titles', () => {
    const movie = DEMO_CHANNELS.find((c) => c.kind === 'movie')!
    const actions = evaluateAutomationRules(DEFAULT_AUTOMATION_RULES, snapshot({
      streamError: 'Stream error. Try another channel.',
      channelId: movie.id,
      buffering: true,
      bufferingStartedAt: Date.now() - 20_000,
    }))
    expect(actions.some((a) => a.kind === 'auto_switch_fallback')).toBe(false)
    expect(actions.some((a) => a.kind === 'toast_fallback_suggest')).toBe(false)
  })

  it('records episode keys to prevent re-fire', () => {
    const snap = snapshot({
      buffering: true,
      bufferingStartedAt: Date.now() - 15_000,
      streamError: null,
    })
    const actions = evaluateAutomationRules(DEFAULT_AUTOMATION_RULES, snap)
    const keys = episodeKeysForActions(actions, snap)
    expect(keys.some((k) => k.includes('rule_buffering_fallback'))).toBe(true)
  })
})
