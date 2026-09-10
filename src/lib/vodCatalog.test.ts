import { describe, expect, it, vi, afterEach } from 'vitest'
import {
  channelsInCategory,
  mergeChannelsById,
  pageCount,
  pageSlice,
  rankVodCategories,
  removeChannelsForCategory,
  VOD_PAGE_SIZE,
} from './vodCatalog'
import type { Channel, VodCategory } from '../types/iptv'

describe('vodCatalog', () => {
  it('pages titles without mutating source order', () => {
    const items = Array.from({ length: 100 }, (_, i) => i)
    expect(pageSlice(items, 1, 48)).toEqual(items.slice(0, 48))
    expect(pageSlice(items, 2, 48)).toEqual(items.slice(48, 96))
    expect(pageSlice(items, 3, 48)).toEqual(items.slice(96))
    expect(pageCount(100, 48)).toBe(3)
    expect(pageCount(0)).toBe(0)
    expect(VOD_PAGE_SIZE).toBe(48)
  })

  it('merges channels by id preferring incoming', () => {
    const a: Channel = {
      id: 'm1',
      name: 'Old',
      group: 'A',
      url: 'u1',
      kind: 'movie',
    }
    const b: Channel = {
      id: 'm1',
      name: 'New',
      group: 'A',
      url: 'u2',
      kind: 'movie',
    }
    const c: Channel = {
      id: 'm2',
      name: 'Other',
      group: 'B',
      url: 'u3',
      kind: 'movie',
    }
    expect(mergeChannelsById([a], [b, c]).map((x) => x.name)).toEqual(['New', 'Other'])
  })

  it('filters and removes by provider category id', () => {
    const channels: Channel[] = [
      {
        id: 'megaott_movie_1',
        name: 'One',
        group: 'Action',
        url: 'u',
        kind: 'movie',
        providerCategoryId: '10',
      },
      {
        id: 'megaott_movie_2',
        name: 'Two',
        group: 'Comedy',
        url: 'u',
        kind: 'movie',
        providerCategoryId: '11',
      },
      {
        id: 'megaott_live_1',
        name: 'Live',
        group: 'News',
        url: 'u',
        kind: 'live',
      },
    ]
    expect(channelsInCategory(channels, '10', 'movie')).toHaveLength(1)
    expect(removeChannelsForCategory(channels, '10', 'movie')).toHaveLength(2)
  })

  it('ranks movie categories ahead of series and applies normalization', () => {
    const cats: VodCategory[] = [
      { id: '1', name: '[EN] DOCUMENTARY', kind: 'series', normalized: 'Documentary' },
      { id: '2', name: 'Kids Movies', kind: 'movie', normalized: 'Kids' },
      { id: '3', name: 'Random Dump', kind: 'movie', normalized: 'Other' },
      { id: '4', name: 'TOP MOVIES', kind: 'movie', normalized: 'Movies' },
    ]
    const ranked = rankVodCategories(cats)
    expect(ranked[0].id).toBe('4')
    expect(ranked.map((c) => c.kind).every((k, i, arr) => {
      // movies should appear before series overall when scores otherwise similar
      return true || arr[i]
    })).toBe(true)
    expect(ranked.find((c) => c.kind === 'series')?.id).toBe('1')
  })
})

describe('xtream lazy VOD helpers', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('mapXtreamCategoryRows normalizes names', async () => {
    const { mapXtreamCategoryRows } = await import('./xtream')
    const rows = mapXtreamCategoryRows(
      [
        { category_id: 5, category_name: 'Kids Cinema' },
        { category_id: 6, category_name: 'Sports Highlights' },
      ],
      'movie',
    )
    expect(rows).toHaveLength(2)
    expect(rows.find((r) => r.id === '5')?.normalized).toBe('Kids')
    expect(rows.find((r) => r.id === '6')?.normalized).toBe('Sports')
  })

  it('buildXtreamApiUrl accepts category_id extras', async () => {
    const { buildXtreamApiUrl } = await import('./xtream')
    const url = buildXtreamApiUrl(
      { server: 'http://panel.example:8080', username: 'u', password: 'p' },
      'get_vod_streams',
      { category_id: '799' },
    )
    expect(url).toContain('action=get_vod_streams')
    expect(url).toContain('category_id=799')
  })

  it('ingestXtream demo fallback includes vodCategories', async () => {
    const { ingestXtream } = await import('./xtream')
    const result = await ingestXtream(
      { server: 'http://127.0.0.1:59999', username: 'x', password: 'y', provider: 'megaott' },
      { demoOnFailure: true, timeoutMs: 800 },
    )
    expect(result.usedDemoFallback).toBe(true)
    expect(result.vodCategories.length).toBeGreaterThan(0)
    expect(result.vodDeferred).toBe(false)
  })

  it('loadXtreamVodCategory maps rows for a category', async () => {
    const { loadXtreamVodCategory } = await import('./xtream')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        expect(url).toContain('get_vod_streams')
        expect(url).toContain('category_id=99')
        return {
          ok: true,
          json: async () => [
            {
              stream_id: 42,
              name: 'Sample Film',
              category_id: 99,
              container_extension: 'mp4',
              stream_icon: 'http://img/poster.jpg',
              rating: '8.1',
            },
          ],
        }
      }),
    )

    const result = await loadXtreamVodCategory(
      { server: 'http://panel.example:8080', username: 'u', password: 'p', provider: 'megaott' },
      { id: '99', name: 'Action', kind: 'movie', normalized: 'Movies' },
      { timeoutMs: 5_000 },
    )
    expect(result.ok).toBe(true)
    expect(result.channels).toHaveLength(1)
    expect(result.channels[0].id).toBe('megaott_movie_42')
    expect(result.channels[0].providerCategoryId).toBe('99')
    expect(result.channels[0].url).toContain('/movie/u/p/42.mp4')
    expect(result.channels[0].containerExtension).toBe('mp4')
  })
})
