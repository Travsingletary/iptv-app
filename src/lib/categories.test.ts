import { describe, expect, it } from 'vitest'
import type { Channel } from '../types/iptv.js'
import {
  FAVORITES_CHIP,
  channelCategory,
  detectCategoryMention,
  normalizeCategory,
  rankCategoryChips,
  rankChannelSearch,
} from './categories.js'

function ch(partial: Partial<Channel> & Pick<Channel, 'id' | 'name' | 'group'>): Channel {
  return {
    url: 'https://example.test/stream.m3u8',
    kind: 'live',
    ...partial,
  }
}

describe('normalizeCategory', () => {
  it('maps messy provider titles into clean buckets', () => {
    expect(normalizeCategory('US|SPORTS|ESPN')).toBe('Sports')
    expect(normalizeCategory('UK - NEWS BBC')).toBe('News')
    expect(normalizeCategory('Kids / Cartoon Network')).toBe('Kids')
    expect(normalizeCategory('VOD|Movies|4K')).toBe('Movies')
    expect(normalizeCategory('Documentary HD')).toBe('Documentary')
    expect(normalizeCategory('MTV Hits')).toBe('Music')
    expect(normalizeCategory('Local USA')).toBe('Local')
    expect(normalizeCategory('Random Pack XYZ')).toBe('Other')
  })

  it('prefers group sports over newsy channel names', () => {
    expect(normalizeCategory('Sports', 'ESPN News Desk')).toBe('Sports')
  })

  it('uses channel name when group is empty', () => {
    expect(normalizeCategory('', 'Cartoon Network')).toBe('Kids')
  })
})

describe('rankCategoryChips', () => {
  const channels = [
    ch({ id: '1', name: 'Arena', group: 'US Sports HD' }),
    ch({ id: '2', name: 'Pulse', group: 'World News' }),
    ch({ id: '3', name: 'Pulse2', group: 'World News' }),
    ch({ id: '4', name: 'Toon', group: 'Kids Pack' }),
    ch({ id: '5', name: 'Cinema', group: 'Movies 4K' }),
    ch({ id: '6', name: 'FavSport', group: 'Sports Extra' }),
  ]

  it('pins Favorites then ranks by relevance', () => {
    const chips = rankCategoryChips({
      channels,
      favorites: ['6'],
      recentIds: ['1'],
      now: new Date('2026-09-09T15:00:00'), // afternoon → Sports/Kids bias
    })
    expect(chips[0]?.id).toBe(FAVORITES_CHIP)
    expect(chips[0]?.label).toBe('Favorites')
    const labels = chips.slice(1).map((c) => c.label)
    expect(labels).toContain('Sports')
    expect(labels).toContain('News')
    // Sports should outrank Other-free buckets due to afternoon + fav/recent
    expect(labels.indexOf('Sports')).toBeLessThan(labels.indexOf('Movies'))
  })

  it('omits Favorites when none favorited', () => {
    const chips = rankCategoryChips({ channels, favorites: [], now: new Date('2026-09-09T08:00:00') })
    expect(chips.every((c) => c.id !== FAVORITES_CHIP)).toBe(true)
  })
})

describe('rankChannelSearch', () => {
  const channels = [
    ch({ id: 'exact', name: 'Sport', group: 'Misc' }),
    ch({ id: 'prefix', name: 'SportsCenter Live', group: 'US Sports' }),
    ch({ id: 'includes', name: 'Arena Sports HD', group: 'Entertainment' }),
    ch({ id: 'news', name: 'Pulse News', group: 'News' }),
    ch({ id: 'fav', name: 'My Sports Night', group: 'Sports' }),
  ]

  it('ranks exact > startsWith > includes and boosts favorites', () => {
    const ranked = rankChannelSearch({
      channels,
      query: 'sport',
      favorites: ['fav'],
      recentIds: [],
    })
    expect(ranked[0]?.id).toBe('exact')
    expect(ranked.map((c) => c.id)).toContain('fav')
    // Favorite boost should lift "My Sports Night" above weak includes when scores close
    const favIdx = ranked.findIndex((c) => c.id === 'fav')
    const includesIdx = ranked.findIndex((c) => c.id === 'includes')
    expect(favIdx).toBeGreaterThanOrEqual(0)
    expect(includesIdx).toBeGreaterThanOrEqual(0)
    expect(favIdx).toBeLessThan(includesIdx)
  })

  it('filters by selected normalized category', () => {
    const ranked = rankChannelSearch({
      channels,
      query: '',
      selectedCategory: 'News',
    })
    expect(ranked.every((c) => channelCategory(c) === 'News')).toBe(true)
    expect(ranked.map((c) => c.id)).toEqual(['news'])
  })

  it('filters Favorites chip', () => {
    const ranked = rankChannelSearch({
      channels,
      query: '',
      selectedCategory: FAVORITES_CHIP,
      favorites: ['fav', 'news'],
    })
    expect(ranked.map((c) => c.id).sort()).toEqual(['fav', 'news'])
  })

  it('boosts matches inside the selected category', () => {
    const ranked = rankChannelSearch({
      channels,
      query: 'sports',
      selectedCategory: 'Sports',
      favorites: [],
    })
    expect(ranked.every((c) => channelCategory(c) === 'Sports' || c.group.toLowerCase().includes('sport'))).toBe(
      true,
    )
  })
})

describe('detectCategoryMention', () => {
  it('detects sports/kids/news phrases', () => {
    expect(detectCategoryMention('recommend sports')).toBe('Sports')
    expect(detectCategoryMention('something for kids')).toBe('Kids')
    expect(detectCategoryMention('news tonight')).toBe('News')
  })
})
