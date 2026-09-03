import { describe, expect, it } from 'vitest'
import { parseM3U } from './m3u'
import { nowPlaying, parseXmltv, progressPct } from './epg'
import { DEMO_CHANNELS, DEMO_EPG } from './demoData'

describe('parseM3U', () => {
  it('parses channels with groups and logos', () => {
    const raw = `#EXTM3U
#EXTINF:-1 tvg-id="news1" tvg-logo="http://logo" group-title="News",Pulse
http://example.com/a.m3u8
#EXTINF:-1 group-title="VOD Movies",Action Flick
http://example.com/b.m3u8
`
    const channels = parseM3U(raw)
    expect(channels).toHaveLength(2)
    expect(channels[0].name).toBe('Pulse')
    expect(channels[0].group).toBe('News')
    expect(channels[0].kind).toBe('live')
    expect(channels[1].kind).toBe('movie')
  })
})

describe('epg helpers', () => {
  it('parses xmltv programmes', () => {
    const xml = `<?xml version="1.0"?>
<tv>
  <programme start="20260101120000 +0000" stop="20260101130000 +0000" channel="aether.one">
    <title>Prime Cut</title>
    <desc>A show</desc>
  </programme>
</tv>`
    const programs = parseXmltv(xml)
    expect(programs).toHaveLength(1)
    expect(programs[0].title).toBe('Prime Cut')
    expect(programs[0].channelId).toBe('aether.one')
  })

  it('finds now playing from demo epg', () => {
    const ch = DEMO_CHANNELS[0]
    const program = nowPlaying(DEMO_EPG, ch.tvgId || ch.id)
    expect(program).toBeTruthy()
    expect(progressPct(program!)).toBeGreaterThanOrEqual(0)
    expect(progressPct(program!)).toBeLessThanOrEqual(100)
  })
})
