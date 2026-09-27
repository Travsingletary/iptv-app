import { describe, expect, it } from 'vitest'
import { filterLiveByRegion, isUsaChannel } from './usaChannels.js'
import type { Channel } from '../types/iptv.js'

function ch(partial: Partial<Channel> & Pick<Channel, 'id' | 'name' | 'group'>): Channel {
  return {
    url: 'https://example.test/x.m3u8',
    kind: 'live',
    ...partial,
  }
}

describe('isUsaChannel', () => {
  it('matches common MegaOTT USA folder titles', () => {
    expect(isUsaChannel(ch({ id: '1', name: 'ESPN', group: 'USA | Sports' }))).toBe(true)
    expect(isUsaChannel(ch({ id: '2', name: 'CNN', group: 'US|NEWS' }))).toBe(true)
    expect(isUsaChannel(ch({ id: '3', name: 'Local', group: 'Local USA' }))).toBe(true)
    expect(isUsaChannel(ch({ id: '4', name: 'ABC', group: 'United States Entertainment' }))).toBe(
      true,
    )
  })

  it('excludes other-country folders', () => {
    expect(isUsaChannel(ch({ id: '1', name: 'BBC', group: 'UK - NEWS' }))).toBe(false)
    expect(isUsaChannel(ch({ id: '2', name: 'TSN', group: 'Canada Sports' }))).toBe(false)
    expect(isUsaChannel(ch({ id: '3', name: 'Tele', group: 'LATINO|ENT' }))).toBe(false)
  })

  it('keeps unscoped US network brands', () => {
    expect(isUsaChannel(ch({ id: '1', name: 'ESPN HD', group: 'Sports' }))).toBe(true)
    expect(isUsaChannel(ch({ id: '2', name: 'FOX News', group: 'News' }))).toBe(true)
  })

  it('drops unscoped foreign-looking names without USA mark', () => {
    expect(isUsaChannel(ch({ id: '1', name: 'Generic Channel', group: 'Entertainment' }))).toBe(
      false,
    )
  })
})

describe('filterLiveByRegion', () => {
  const pack = [
    ch({ id: 'us1', name: 'ESPN', group: 'USA | Sports' }),
    ch({ id: 'uk1', name: 'BBC', group: 'UK - NEWS' }),
    ch({ id: 'm1', name: 'Film', group: 'Movies', kind: 'movie' }),
  ]

  it('usa mode keeps only USA live', () => {
    expect(filterLiveByRegion(pack, 'usa').map((c) => c.id)).toEqual(['us1'])
  })

  it('all mode keeps every live channel', () => {
    expect(filterLiveByRegion(pack, 'all').map((c) => c.id)).toEqual(['us1', 'uk1'])
  })
})
