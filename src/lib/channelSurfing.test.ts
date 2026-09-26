import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import type { Channel, EpgProgram } from '../types/iptv'
import {
  appendChannelDigit,
  channelDisplayNumber,
  clearAllSurfingTimers,
  matchChannelByNumber,
  nowAndNext,
  scheduleZapTune,
  stepZapIndex,
  surfingHopIds,
  ZAP_TUNE_DEBOUNCE_MS,
} from './channelSurfing'

function live(partial: Partial<Channel> & { id: string; name: string }): Channel {
  return {
    group: 'Entertainment',
    url: 'https://example.test/live.m3u8',
    kind: 'live',
    ...partial,
  }
}

describe('channelDisplayNumber', () => {
  it('prefers provider LCN over index', () => {
    expect(channelDisplayNumber(live({ id: 'a', name: 'A', number: 42 }), 0)).toBe(42)
    expect(channelDisplayNumber(live({ id: 'b', name: 'B' }), 3)).toBe(4)
  })
})

describe('stepZapIndex', () => {
  it('wraps around the live list', () => {
    expect(stepZapIndex(0, -1, 5)).toBe(4)
    expect(stepZapIndex(4, 1, 5)).toBe(0)
    expect(stepZapIndex(2, 1, 5)).toBe(3)
    expect(stepZapIndex(-1, 1, 5)).toBe(0)
    expect(stepZapIndex(0, 1, 0)).toBe(-1)
  })
})

describe('appendChannelDigit / matchChannelByNumber', () => {
  const channels = [
    live({ id: 'a', name: 'One', number: 1 }),
    live({ id: 'b', name: 'Seven', number: 7 }),
    live({ id: 'c', name: 'Seventy', number: 70 }),
    live({ id: 'd', name: 'Index only' }),
  ]

  it('builds digit buffer and restarts after max length', () => {
    expect(appendChannelDigit('', '1')).toBe('1')
    expect(appendChannelDigit('12', '3')).toBe('123')
    expect(appendChannelDigit('1234', '5')).toBe('5')
    expect(appendChannelDigit('1', 'x')).toBe('1')
  })

  it('matches exact LCN before index', () => {
    expect(matchChannelByNumber(channels, '7')?.channel.id).toBe('b')
    expect(matchChannelByNumber(channels, '70')?.channel.id).toBe('c')
  })

  it('falls back to 1-based list index', () => {
    expect(matchChannelByNumber(channels, '4')?.channel.id).toBe('d')
  })
})

describe('nowAndNext', () => {
  it('returns current and following EPG rows', () => {
    const now = 1_700_000_000_000
    const programs: EpgProgram[] = [
      {
        id: 'p1',
        channelId: 'ch',
        title: 'Now Show',
        start: now - 10_000,
        end: now + 10_000,
      },
      {
        id: 'p2',
        channelId: 'ch',
        title: 'Next Show',
        start: now + 10_000,
        end: now + 40_000,
      },
    ]
    const pair = nowAndNext(programs, 'ch', now)
    expect(pair.now?.title).toBe('Now Show')
    expect(pair.next?.title).toBe('Next Show')
  })
})

describe('surfingHopIds', () => {
  it('orders recents then favorites, skips current and non-live', () => {
    expect(
      surfingHopIds({
        recentIds: ['r1', 'cur', 'r2', 'vod'],
        favoriteIds: ['f1', 'r1', 'f2'],
        liveIds: ['r1', 'r2', 'f1', 'f2', 'cur'],
        currentId: 'cur',
        limit: 8,
      }),
    ).toEqual(['r1', 'r2', 'f1', 'f2'])
  })
})

describe('scheduleZapTune', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    clearAllSurfingTimers()
  })
  afterEach(() => {
    clearAllSurfingTimers()
    vi.useRealTimers()
  })

  it('debounces so only the final channel tunes', () => {
    const tuned: string[] = []
    scheduleZapTune('a', (id) => tuned.push(id))
    scheduleZapTune('b', (id) => tuned.push(id))
    scheduleZapTune('c', (id) => tuned.push(id))
    expect(tuned).toEqual([])
    vi.advanceTimersByTime(ZAP_TUNE_DEBOUNCE_MS - 1)
    expect(tuned).toEqual([])
    vi.advanceTimersByTime(1)
    expect(tuned).toEqual(['c'])
  })
})
