import { describe, expect, it } from 'vitest'
import { parseNlEpgQuery, searchNlEpg } from './nlEpgSearch'
import { DEMO_CHANNELS, refreshDemoEpg } from './demoData'

describe('nlEpgSearch', () => {
  const now = Date.UTC(2026, 8, 6, 18, 0, 0)

  it('parses sports in next 2 hours', () => {
    const filters = parseNlEpgQuery('sports in next 2 hours', now)
    expect(filters.category).toBe('Sports')
    expect(filters.windowEndMs - filters.windowStartMs).toBe(2 * 3_600_000)
  })

  it('parses movies under 2h', () => {
    const filters = parseNlEpgQuery('movies under 2h', now)
    expect(filters.category).toBe('Movies')
    expect(filters.maxDurationMs).toBe(2 * 3_600_000)
    expect(filters.kind).toBe('movie')
  })

  it('returns structured sports hits from demo EPG', () => {
    const epg = refreshDemoEpg(now)
    const { hits, filters } = searchNlEpg('sports in next 2 hours', DEMO_CHANNELS, epg, {
      now,
      limit: 5,
      favoriteIds: ['live_arena_sports'],
    })
    expect(filters.category).toBe('Sports')
    expect(hits.length).toBeGreaterThan(0)
    expect(hits.some((h) => /arena|match|sports/i.test(`${h.title} ${h.channelName}`))).toBe(
      true,
    )
    expect(hits[0].start).toBeTypeOf('number')
    expect(hits[0].durationMs).toBeGreaterThan(0)
  })
})
