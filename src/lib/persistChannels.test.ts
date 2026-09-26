import { describe, expect, it } from 'vitest'
import type { Channel } from '../types/iptv'
import {
  LEGACY_PERSIST_CHANNEL_CAP,
  channelsForPersistence,
  channelsForPersistenceTight,
  compactChannelForPersist,
  shouldBackgroundRefreshLiveCatalog,
} from './persistChannels'

function live(i: number): Channel {
  return {
    id: `live_${i}`,
    name: `Channel ${i}`,
    group: 'Sports',
    url: `http://example.test/${i}.ts`,
    kind: 'live',
    logo: `http://cdn.test/${i}.png`,
    poster: 'big',
    backdrop: 'bigger',
    description: 'desc',
  }
}

describe('channelsForPersistence', () => {
  it('keeps all live channels (no 500 cap) and drops VOD', () => {
    const channels = [
      ...Array.from({ length: 6897 }, (_, i) => live(i)),
      {
        id: 'movie_1',
        name: 'Film',
        group: 'Movies',
        url: 'http://example.test/m.mp4',
        kind: 'movie' as const,
      },
    ]
    const persisted = channelsForPersistence(channels)
    expect(persisted).toHaveLength(6897)
    expect(persisted.every((c) => c.kind === 'live')).toBe(true)
    expect(persisted[0].poster).toBeUndefined()
    expect(persisted[0].description).toBeUndefined()
    expect(persisted[0].logo).toBeTruthy()
  })

  it('tight mode also drops logos', () => {
    const tight = channelsForPersistenceTight([live(1)])
    expect(tight[0].logo).toBeUndefined()
    expect(tight[0].url).toContain('1.ts')
  })

  it('compactChannelForPersist preserves playback fields', () => {
    const c = compactChannelForPersist(live(2))
    expect(c.id).toBe('live_2')
    expect(c.url).toBeTruthy()
    expect(c.poster).toBeUndefined()
  })
})

describe('shouldBackgroundRefreshLiveCatalog', () => {
  it('refreshes MegaOTT when stuck on the legacy 500 cap', () => {
    expect(
      shouldBackgroundRefreshLiveCatalog({
        sourceType: 'megaott',
        liveCount: LEGACY_PERSIST_CHANNEL_CAP,
      }),
    ).toBe(true)
  })

  it('does not refresh demo or healthy large catalogs', () => {
    expect(
      shouldBackgroundRefreshLiveCatalog({ sourceType: 'demo', liveCount: 12 }),
    ).toBe(false)
    expect(
      shouldBackgroundRefreshLiveCatalog({ sourceType: 'megaott', liveCount: 6897 }),
    ).toBe(false)
  })
})
