import { describe, expect, it } from 'vitest'
import {
  buildDemoCatchupStub,
  buildXtreamApiUrl,
  buildXtreamCatchupUrl,
  buildXtreamStreamUrl,
  ingestXtream,
  resolveCatchupPlayback,
} from './xtream'
import { DEMO_CHANNELS } from './demoData'
import type { PlaylistSource } from '../types/iptv'

describe('xtream', () => {
  const creds = {
    server: 'http://panel.example:8080',
    username: 'user',
    password: 'pass',
  }

  it('builds player API and stream URLs', () => {
    expect(buildXtreamApiUrl(creds, 'get_live_streams')).toContain(
      'player_api.php?username=user&password=pass&action=get_live_streams',
    )
    expect(buildXtreamStreamUrl(creds, 'live', 42)).toBe(
      'http://panel.example:8080/live/user/pass/42.m3u8',
    )
    expect(buildXtreamCatchupUrl(creds, 42, 1700000000, 3600)).toContain(
      'timeshift.php',
    )
  })

  it('falls back to demo pack when panel is unreachable', async () => {
    const result = await ingestXtream(
      { server: 'http://127.0.0.1:59999', username: 'x', password: 'y', provider: 'megaott' },
      { demoOnFailure: true, timeoutMs: 1500 },
    )
    expect(result.usedDemoFallback).toBe(true)
    expect(result.channels.length).toBeGreaterThan(0)
    expect(result.message).toMatch(/MegaOTT unavailable/i)
    expect(result.message).toMatch(/demo pack/i)
  })

  it('builds catchup stub mentioning MegaOTT archive when unavailable', () => {
    const arena = DEMO_CHANNELS.find((c) => c.id === 'live_arena_sports')!
    const stub = buildDemoCatchupStub(arena, 30)
    expect(stub.supported).toBe(true)
    expect(stub.mode).toBe('demo_stub')
    expect(stub.url).toContain('aether_catchup=30m')
    expect(stub.label).toMatch(/MegaOTT archive unavailable/i)
    const news = DEMO_CHANNELS.find((c) => c.id === 'live_pulse_news')!
    expect(buildDemoCatchupStub(news, 30).supported).toBe(false)
  })

  it('resolves real timeshift when MegaOTT source credentials exist', () => {
    const channel = {
      id: 'megaott_live_99',
      name: 'Archive Live',
      group: 'Live',
      url: 'http://panel.example:8080/live/user/pass/99.m3u8',
      kind: 'live' as const,
      catchup: true,
      streamId: '99',
    }
    const source: PlaylistSource = {
      id: 'mo_1',
      name: 'MegaOTT',
      type: 'megaott',
      url: 'http://panel.example:8080',
      username: 'user',
      password: 'pass',
      createdAt: Date.now(),
    }
    const resolved = resolveCatchupPlayback(channel, 15, source)
    expect(resolved.supported).toBe(true)
    expect(resolved.mode).toBe('xtream')
    expect(resolved.url).toContain('timeshift.php')
    expect(resolved.url).toContain('stream=99')
    expect(resolved.label).toMatch(/MegaOTT timeshift/i)
  })

  it('resolves real Xtream timeshift when source credentials exist', () => {
    const channel = {
      id: 'xtream_live_99',
      name: 'Archive Live',
      group: 'Live',
      url: 'http://panel.example:8080/live/user/pass/99.m3u8',
      kind: 'live' as const,
      catchup: true,
      streamId: '99',
    }
    const source: PlaylistSource = {
      id: 'xt_1',
      name: 'Xtream',
      type: 'xtream',
      url: 'http://panel.example:8080',
      username: 'user',
      password: 'pass',
      createdAt: Date.now(),
    }
    const resolved = resolveCatchupPlayback(channel, 15, source)
    expect(resolved.supported).toBe(true)
    expect(resolved.mode).toBe('xtream')
    expect(resolved.url).toContain('timeshift.php')
    expect(resolved.label).toMatch(/Xtream timeshift/i)
  })

  it('falls back to MegaOTT-labeled demo stub without panel source', () => {
    const arena = DEMO_CHANNELS.find((c) => c.id === 'live_arena_sports')!
    const resolved = resolveCatchupPlayback(arena, 15, null)
    expect(resolved.mode).toBe('demo_stub')
    expect(resolved.label).toMatch(/MegaOTT archive unavailable/i)
  })
})
