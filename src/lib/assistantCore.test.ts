import { describe, expect, it } from 'vitest'
import { resolveAssistantReply } from './assistantCore'
import { DEMO_CHANNELS, DEMO_EPG } from './demoData'

describe('resolveAssistantReply', () => {
  it('returns deterministic mock with recommend tool without model key', async () => {
    const result = await resolveAssistantReply('Recommend something to watch', {
      view: 'home',
      currentChannelId: 'live_aether_one',
      favorites: ['live_arena_sports'],
      recentIds: ['live_pulse_news'],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })

    expect(result.response.length).toBeGreaterThan(0)
    const recommend = result.toolCalls.find((tool) => tool.tool === 'recommend_now')
    expect(recommend?.status).toBe('executed')
    expect(recommend?.data?.channelIds?.length).toBeGreaterThan(0)
    expect(result.steps?.length).toBeGreaterThan(0)
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

  it('executes set_mute for mute requests', async () => {
    const result = await resolveAssistantReply('Mute', {
      view: 'live',
      currentChannelId: 'live_aether_one',
      favorites: [],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })

    const mute = result.toolCalls.find((tool) => tool.tool === 'set_mute')
    expect(mute?.data?.muted).toBe(true)
  })

  it('executes set_reminder for upcoming guide titles', async () => {
    const result = await resolveAssistantReply('Remind me when Match Center starts', {
      view: 'guide',
      currentChannelId: null,
      favorites: [],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })

    const reminder = result.toolCalls.find((tool) => tool.tool === 'set_reminder')
    expect(reminder?.status).toBe('executed')
    expect(reminder?.data?.reminders?.length).toBeGreaterThan(0)
  })

  it('multi-step mute + remind and confirm gate for clear', async () => {
    const multi = await resolveAssistantReply(
      'Mute and remind me when Match Center starts',
      {
        view: 'live',
        currentChannelId: 'live_aether_one',
        favorites: [],
        recentIds: [],
        channels: DEMO_CHANNELS,
        epg: DEMO_EPG,
      },
    )
    expect(multi.steps?.length).toBeGreaterThanOrEqual(2)
    expect(multi.toolCalls.some((t) => t.tool === 'set_mute')).toBe(true)
    expect(multi.toolCalls.some((t) => t.tool === 'set_reminder')).toBe(true)

    const pending = await resolveAssistantReply('Clear all reminders', {
      view: 'live',
      currentChannelId: null,
      favorites: [],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })
    expect(pending.needsConfirmation).toBe(true)

    const confirmed = await resolveAssistantReply(
      'Clear all reminders',
      {
        view: 'live',
        currentChannelId: null,
        favorites: [],
        recentIds: [],
        channels: DEMO_CHANNELS,
        epg: DEMO_EPG,
      },
      { confirmed: true },
    )
    expect(confirmed.needsConfirmation).toBe(false)
    expect(confirmed.steps?.some((s) => s.tool === 'clear_reminders' && s.status === 'executed')).toBe(
      true,
    )
  })

  it('executes NL sports EPG search with structured fields', async () => {
    const result = await resolveAssistantReply('sports in next 2 hours', {
      view: 'guide',
      currentChannelId: null,
      favorites: ['live_arena_sports'],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })

    const search = result.toolCalls.find((tool) => tool.tool === 'search_epg')
    expect(search?.status).toBe('executed')
    expect(search?.data?.programs?.length).toBeGreaterThan(0)
    expect(search?.data?.epgFilters?.category).toBe('Sports')
    expect(search?.data?.programs?.[0]?.start).toBeTypeOf('number')
  })

  it('returns polished mock replies for greetings and help', async () => {
    const hi = await resolveAssistantReply('Hello', {
      view: 'live',
      currentChannelId: 'live_aether_one',
      favorites: [],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })
    expect(hi.aiMode).toBe('mock')
    expect(hi.response).toMatch(/Hello|SteadyStream/i)

    const help = await resolveAssistantReply('help', {
      view: 'home',
      currentChannelId: null,
      favorites: [],
      recentIds: [],
      channels: DEMO_CHANNELS,
      epg: DEMO_EPG,
    })
    expect(help.response).toMatch(/Recommend|sports in next/i)
  })
})
