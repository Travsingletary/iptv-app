import { describe, expect, it } from 'vitest'
import {
  applyHighestQualityPreference,
  detectStreamContainer,
  isAviUrl,
  isHlsUrl,
  isMatroskaUrl,
  isMpegTsUrl,
  isProgressiveUrl,
  pickHighestQualityLevelIndex,
  unsupportedFormatMessage,
  FORMAT_SUPPORT_MATRIX,
} from './playback'

describe('detectStreamContainer', () => {
  it('detects HLS / MPEG-TS / progressive / unsupported', () => {
    expect(detectStreamContainer('https://cdn.example/live/a.m3u8')).toBe('hls')
    expect(detectStreamContainer('https://cdn.example/live/1.ts')).toBe('mpegts')
    expect(detectStreamContainer('https://cdn.example/movie.mp4')).toBe('mp4')
    expect(detectStreamContainer('https://cdn.example/film.mkv')).toBe('mkv')
    expect(detectStreamContainer('https://cdn.example/old.avi')).toBe('avi')
    expect(detectStreamContainer('http://panel/live/user/pass/42')).toBe('hls')
  })
})

describe('url helpers', () => {
  it('classifies URLs for the player branch', () => {
    expect(isMpegTsUrl('https://x/a.ts')).toBe(true)
    expect(isMpegTsUrl('https://x/a.m3u8')).toBe(false)
    expect(isProgressiveUrl('https://x/a.mp4')).toBe(true)
    expect(isMatroskaUrl('https://x/a.mkv')).toBe(true)
    expect(isAviUrl('https://x/a.avi')).toBe(true)
    expect(isHlsUrl('https://x/a.m3u8')).toBe(true)
  })
})

describe('unsupportedFormatMessage', () => {
  it('explains MKV and AVI clearly', () => {
    expect(unsupportedFormatMessage('https://x/a.mkv')).toMatch(/Matroska|\.mkv/i)
    expect(unsupportedFormatMessage('https://x/a.avi')).toMatch(/AVI/i)
    expect(unsupportedFormatMessage('https://x/a.mp4')).toBeNull()
  })
})

describe('pickHighestQualityLevelIndex', () => {
  it('picks highest bitrate', () => {
    const levels = [
      { bitrate: 800_000, width: 1280, height: 720 },
      { bitrate: 4_500_000, width: 1920, height: 1080 },
      { bitrate: 1_500_000, width: 1280, height: 720 },
    ]
    expect(pickHighestQualityLevelIndex(levels)).toBe(1)
  })

  it('falls back to resolution when bitrate missing', () => {
    const levels = [
      { width: 1280, height: 720 },
      { width: 3840, height: 2160 },
      { width: 1920, height: 1080 },
    ]
    expect(pickHighestQualityLevelIndex(levels)).toBe(1)
  })

  it('returns -1 for empty', () => {
    expect(pickHighestQualityLevelIndex([])).toBe(-1)
  })
})

describe('applyHighestQualityPreference', () => {
  it('pins start/current/load to highest level', () => {
    const hls = { startLevel: -1, currentLevel: -1, loadLevel: -1, nextLevel: -1 }
    const idx = applyHighestQualityPreference(hls, [{ bitrate: 1_000_000 }, { bitrate: 8_000_000 }])
    expect(idx).toBe(1)
    expect(hls.startLevel).toBe(1)
    expect(hls.currentLevel).toBe(1)
    expect(hls.loadLevel).toBe(1)
  })
})

describe('FORMAT_SUPPORT_MATRIX', () => {
  it('documents mkv/avi as unsupported on web', () => {
    const mkv = FORMAT_SUPPORT_MATRIX.find((r) => r.container === 'mkv')
    const avi = FORMAT_SUPPORT_MATRIX.find((r) => r.container === 'avi')
    expect(mkv?.web).toBe('unsupported')
    expect(avi?.web).toBe('unsupported')
    expect(mkv?.androidNativeHint).toMatch(/ExoPlayer|VLC/i)
  })
})
