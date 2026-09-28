import type { Channel, EpgProgram } from '../types/iptv'
import { nowPlaying, programsForChannel } from './epg'

/** Delay before committing a rapid ↑↓ zap to the actual stream tune. */
export const ZAP_TUNE_DEBOUNCE_MS = 280
/** Zap OSD auto-hide. */
export const ZAP_OSD_HIDE_MS = 2500
/** Number-pad entry commit after last digit. */
export const DIGIT_COMMIT_MS = 1200
export const MAX_DIGIT_LEN = 4

export type ZapDirection = -1 | 1

/** 1-based display / LCN: prefer provider `number`, else live list index + 1. */
export function channelDisplayNumber(channel: Channel, liveIndex: number): number {
  if (typeof channel.number === 'number' && Number.isFinite(channel.number) && channel.number > 0) {
    return Math.floor(channel.number)
  }
  return liveIndex + 1
}

export function stepZapIndex(currentIndex: number, dir: ZapDirection, length: number): number {
  if (length <= 0) return -1
  if (currentIndex < 0) return dir === 1 ? 0 : length - 1
  return (currentIndex + dir + length) % length
}

export function appendChannelDigit(buffer: string, digit: string, maxLen = MAX_DIGIT_LEN): string {
  if (!/^\d$/.test(digit)) return buffer
  const next = `${buffer}${digit}`
  if (next.length > maxLen) return digit
  // Leading zeros collapse to a fresh entry starting at this digit once maxed.
  return next
}

/**
 * Match typed digits to a live channel.
 * Prefer exact LCN / `number`, then exact 1-based index, then prefix LCN.
 */
export function matchChannelByNumber(
  liveChannels: Channel[],
  digits: string,
): { channel: Channel; index: number } | null {
  const trimmed = digits.replace(/\D/g, '')
  if (!trimmed) return null
  const n = Number.parseInt(trimmed, 10)
  if (!Number.isFinite(n) || n <= 0) return null

  for (let i = 0; i < liveChannels.length; i += 1) {
    const ch = liveChannels[i]
    if (typeof ch.number === 'number' && Math.floor(ch.number) === n) {
      return { channel: ch, index: i }
    }
  }

  const byIndex = liveChannels[n - 1]
  if (byIndex) return { channel: byIndex, index: n - 1 }

  for (let i = 0; i < liveChannels.length; i += 1) {
    const ch = liveChannels[i]
    const display = channelDisplayNumber(ch, i)
    if (String(display).startsWith(trimmed)) {
      return { channel: ch, index: i }
    }
  }

  return null
}

export function nowAndNext(
  programs: EpgProgram[],
  channelKey: string,
  now = Date.now(),
): { now?: EpgProgram; next?: EpgProgram } {
  const list = programsForChannel(programs, channelKey, now, 8 * 60 * 60_000)
  const current = nowPlaying(programs, channelKey, now) ?? list.find((p) => p.start <= now && p.end > now)
  const next =
    list.find((p) => (current ? p.start >= current.end : p.start > now)) ??
    list.find((p) => p.start > now)
  return { now: current, next }
}

/** Build ordered hop targets: recents first (excluding on-air), then favorites not already listed. */
export function surfingHopIds(opts: {
  recentIds: string[]
  favoriteIds: string[]
  liveIds: Set<string> | string[]
  currentId: string | null
  limit?: number
}): string[] {
  const live = opts.liveIds instanceof Set ? opts.liveIds : new Set(opts.liveIds)
  const limit = opts.limit ?? 8
  const out: string[] = []
  const seen = new Set<string>()
  const push = (id: string) => {
    if (!id || id === opts.currentId || seen.has(id) || !live.has(id)) return
    seen.add(id)
    out.push(id)
  }
  for (const id of opts.recentIds) {
    push(id)
    if (out.length >= limit) return out
  }
  for (const id of opts.favoriteIds) {
    push(id)
    if (out.length >= limit) return out
  }
  return out
}

/** Module-level timers so zap debounce works from App key handler without React churn. */
let zapTuneTimer: ReturnType<typeof setTimeout> | null = null
let zapOsdTimer: ReturnType<typeof setTimeout> | null = null
let digitCommitTimer: ReturnType<typeof setTimeout> | null = null

export function clearZapTuneTimer() {
  if (zapTuneTimer != null) {
    clearTimeout(zapTuneTimer)
    zapTuneTimer = null
  }
}

export function clearZapOsdTimer() {
  if (zapOsdTimer != null) {
    clearTimeout(zapOsdTimer)
    zapOsdTimer = null
  }
}

export function clearDigitCommitTimer() {
  if (digitCommitTimer != null) {
    clearTimeout(digitCommitTimer)
    digitCommitTimer = null
  }
}

export function clearAllSurfingTimers() {
  clearZapTuneTimer()
  clearZapOsdTimer()
  clearDigitCommitTimer()
}

export function scheduleZapTune(channelId: string, tune: (id: string) => void, ms = ZAP_TUNE_DEBOUNCE_MS) {
  clearZapTuneTimer()
  zapTuneTimer = setTimeout(() => {
    zapTuneTimer = null
    tune(channelId)
  }, ms)
}

export function scheduleZapOsdHide(hide: () => void, ms = ZAP_OSD_HIDE_MS) {
  clearZapOsdTimer()
  zapOsdTimer = setTimeout(() => {
    zapOsdTimer = null
    hide()
  }, ms)
}

export function scheduleDigitCommit(commit: () => void, ms = DIGIT_COMMIT_MS) {
  clearDigitCommitTimer()
  digitCommitTimer = setTimeout(() => {
    digitCommitTimer = null
    commit()
  }, ms)
}
