import { describe, expect, it } from 'vitest'
import {
  executeAgentPlan,
  isToolAllowed,
  planAgentSteps,
  runAgentTurn,
  TOOL_ALLOWLIST,
} from './agentLoop'
import { DEMO_CHANNELS, DEMO_EPG } from './demoData'

const baseContext = {
  view: 'live',
  currentChannelId: 'live_aether_one' as string | null,
  favorites: ['live_arena_sports'],
  recentIds: ['live_pulse_news'],
  channels: DEMO_CHANNELS,
  epg: DEMO_EPG,
  history: [] as Array<{ role: 'user' | 'assistant'; text: string }>,
}

describe('agentLoop', () => {
  it('allowlists known tools only', () => {
    expect(isToolAllowed('play_channel')).toBe(true)
    expect(isToolAllowed('clear_reminders')).toBe(true)
    expect(isToolAllowed('rm_rf')).toBe(false)
    expect(TOOL_ALLOWLIST.clear_reminders.risk).toBe('confirm')
  })

  it('plans multi-step mute + remind', () => {
    const plan = planAgentSteps('Mute and remind me when Match Center starts', baseContext)
    const tools = plan.steps.map((s) => s.tool)
    expect(tools).toContain('set_mute')
    expect(tools).toContain('set_reminder')
    expect(plan.steps.length).toBeGreaterThanOrEqual(2)
  })

  it('leaves clear_reminders pending until confirmed', () => {
    const pending = runAgentTurn('Clear all reminders', baseContext, { confirmed: false })
    expect(pending.needsConfirmation).toBe(true)
    expect(pending.steps.some((s) => s.status === 'pending_confirm')).toBe(true)

    const confirmed = runAgentTurn('Clear all reminders', baseContext, { confirmed: true })
    expect(confirmed.needsConfirmation).toBe(false)
    expect(confirmed.steps.some((s) => s.tool === 'clear_reminders' && s.status === 'executed')).toBe(
      true,
    )
  })

  it('executes play_channel from plan', () => {
    const plan = planAgentSteps('Play Arena Sports HD', baseContext)
    const result = executeAgentPlan(plan, baseContext)
    const play = result.toolCalls.find((t) => t.tool === 'play_channel')
    expect(play?.data?.channelId).toBe('live_arena_sports')
  })

  it('recommend_now accepts normalized category mentions', () => {
    const plan = planAgentSteps('Recommend sports', baseContext)
    const rec = plan.steps.find((s) => s.tool === 'recommend_now')
    expect(rec?.input.category).toBe('Sports')
    const result = executeAgentPlan(plan, baseContext)
    const call = result.toolCalls.find((t) => t.tool === 'recommend_now')
    expect(call?.result).toMatch(/Sports/i)
    expect(call?.data?.channelIds?.[0]).toBe('live_arena_sports')
  })

  it('play_channel resolves category-only utterances', () => {
    const turn = runAgentTurn('Play sports', baseContext)
    const play = turn.toolCalls.find((t) => t.tool === 'play_channel')
    expect(play?.data?.channelId).toBe('live_arena_sports')
  })
})
