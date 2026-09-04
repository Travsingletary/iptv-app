import { describe, expect, it } from 'vitest'
import { resolveAssistantReply } from './assistantCore'
import { DEMO_CHANNELS, DEMO_EPG } from './demoData'

describe('resolveAssistantReply', () => {
  it('returns deterministic fallback response without model key', async () => {
    const result = await resolveAssistantReply('Recommend something to watch', {
      view: 'home',
      currentChannelId: 'live_aether_one',
      favorites: ['live_arena_sports'],
      recentIds: ['live_pulse_news'],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })

    expect(result.response).toContain('I can help with channel discovery')
    const recommend = result.toolCalls.find((tool) => tool.tool === 'recommend_now')
    expect(recommend?.status).toBe('executed')
    expect(recommend?.data?.channelIds?.length).toBeGreaterThan(0)
  })

  it('executes play_channel for a named channel', async () => {
    const result = await resolveAssistantReply('Play Arena Sports HD', {
      view: 'live',
      currentChannelId: null,
      favorites: [],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })

    const play = result.toolCalls.find((tool) => tool.tool === 'play_channel')
    expect(play?.status).toBe('executed')
    expect(play?.data?.channelId).toBe('live_arena_sports')
    expect(play?.result).toContain('Arena Sports HD')
  })

  it('executes search_epg against demo guide data', async () => {
    const result = await resolveAssistantReply('What is on in sports?', {
      view: 'guide',
      currentChannelId: null,
      favorites: [],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })

    const search = result.toolCalls.find((tool) => tool.tool === 'search_epg')
    expect(search?.status).toBe('executed')
    expect(search?.data?.programs?.length).toBeGreaterThan(0)
  })
})
