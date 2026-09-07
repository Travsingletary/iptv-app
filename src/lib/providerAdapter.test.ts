import { describe, expect, it } from 'vitest'
import {
  buildChannelCatalog,
  isProviderConfigured,
  syntheticMessageForTool,
} from './providerAdapter'
import { DEMO_CHANNELS } from './demoData'

describe('providerAdapter', () => {
  it('requires an API key to be configured', () => {
    expect(isProviderConfigured({})).toBe(false)
    expect(isProviderConfigured({ provider: 'openai' })).toBe(false)
    expect(isProviderConfigured({ apiKey: 'sk-test' })).toBe(true)
  })

  it('builds an id=name channel catalog for the system prompt', () => {
    const catalog = buildChannelCatalog({ channels: DEMO_CHANNELS.slice(0, 3) })
    expect(catalog).toContain('live_aether_one=Aether One')
    expect(catalog).toContain('live_pulse_news=Pulse News 24')
  })

  it('prefers a named channel in the user utterance over a wrong model id', () => {
    const synthetic = syntheticMessageForTool(
      'play_channel',
      { channelId: 'live_aether_one' },
      'Play Pulse News 24',
      { channels: DEMO_CHANNELS },
    )
    expect(synthetic.toLowerCase()).toContain('pulse news')
    expect(synthetic).not.toContain('live_aether_one')
  })

  it('uses a known model channel id when the utterance does not name a channel', () => {
    const synthetic = syntheticMessageForTool(
      'play_channel',
      { channelId: 'live_arena_sports' },
      'Play the sports one',
      { channels: DEMO_CHANNELS },
    )
    expect(synthetic).toBe('Play live_arena_sports')
  })
})
