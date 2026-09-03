import { describe, expect, it } from 'vitest'
import { resolveAssistantReply } from './assistantCore'
import { DEMO_CHANNELS } from './demoData'

describe('resolveAssistantReply', () => {
  it('returns deterministic fallback response without model key', async () => {
    const result = await resolveAssistantReply('Recommend something to watch', {
      view: 'home',
      currentChannelId: 'live_aether_one',
      favorites: ['live_arena_sports'],
      recentIds: ['live_pulse_news'],
      channels: DEMO_CHANNELS,
    })

    expect(result.response).toContain('I can help with channel discovery')
    expect(result.toolCalls.some((tool) => tool.tool === 'recommend_now')).toBe(true)
  })
})
