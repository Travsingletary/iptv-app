import { describe, expect, it } from 'vitest'
import { DEMO_CHANNELS } from './demoData'
import { buildForYouNow } from './recommendations'

describe('buildForYouNow', () => {
  it('prioritizes favorites and recents', () => {
    const picks = buildForYouNow(
      {
        channels: DEMO_CHANNELS,
        favorites: ['live_arena_sports'],
        recentIds: ['live_pulse_news'],
        now: new Date('2026-09-03T20:30:00Z'),
      },
      4,
    )

    const topIds = picks.map((ch) => ch.id)
    expect(topIds).toContain('live_arena_sports')
    expect(topIds).toContain('live_pulse_news')
  })

  it('returns deterministic order for a fixed time', () => {
    const first = buildForYouNow(
      {
        channels: DEMO_CHANNELS,
        favorites: [],
        recentIds: [],
        now: new Date('2026-09-03T08:00:00Z'),
      },
      5,
    )

    const second = buildForYouNow(
      {
        channels: DEMO_CHANNELS,
        favorites: [],
        recentIds: [],
        now: new Date('2026-09-03T08:00:00Z'),
      },
      5,
    )

    expect(first.map((ch) => ch.id)).toEqual(second.map((ch) => ch.id))
  })

  it('biases toward interest tags when provided', () => {
    const picks = buildForYouNow(
      {
        channels: DEMO_CHANNELS,
        favorites: [],
        recentIds: [],
        interestTags: ['sports'],
        now: new Date('2026-09-03T14:00:00Z'),
      },
      3,
    )
    expect(picks[0]?.group.toLowerCase()).toContain('sport')
  })
})
