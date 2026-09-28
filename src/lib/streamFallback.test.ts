import { describe, expect, it } from 'vitest'
import { suggestStreamFallback, suggestStreamFallbacks } from './streamFallback'
import { DEMO_CHANNELS } from './demoData'

describe('streamFallback', () => {
  it('suggests same-group alternate for a live channel', () => {
    const pick = suggestStreamFallback('live_aether_one', DEMO_CHANNELS)
    expect(pick).not.toBeNull()
    expect(pick!.channelId).not.toBe('live_aether_one')
  })

  it('ranks same-group titles first', () => {
    const list = suggestStreamFallbacks('movie_aurora_drift', DEMO_CHANNELS, 3)
    expect(list.length).toBeGreaterThan(0)
    expect(list.every((item) => item.channelId !== 'movie_aurora_drift')).toBe(true)
  })
})
