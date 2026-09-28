import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

describe('eventLogger buffer', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.useFakeTimers()
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('keeps rapid search/switch/favorite events (does not drop on debounce)', async () => {
    const { trackEvent, eventLogger } = await import('./eventLogger')

    await trackEvent('search_query', { query: 'Arena' })
    await trackEvent('channel_switch', { fromChannelId: 'a', toChannelId: 'b' })
    await trackEvent('play_start', { channelId: 'b' })
    await trackEvent('favorite_toggle', { channelId: 'b', favored: true })

    const peek = eventLogger.peekBuffer()
    const types = peek.map((e) => e.type)
    expect(types).toEqual([
      'search_query',
      'channel_switch',
      'play_start',
      'favorite_toggle',
    ])

    // Flush debounce so localStorage mirrors memory.
    await vi.advanceTimersByTimeAsync(250)
    const raw = window.localStorage.getItem('aether_event_buffer')
    expect(raw).toBeTruthy()
    const stored = JSON.parse(raw!) as { type: string }[]
    expect(stored.map((e) => e.type)).toEqual(types)
  })
})
