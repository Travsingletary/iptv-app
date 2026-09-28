import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DEMO_CHANNELS, DEMO_EPG } from './demoData'

vi.mock('./providerAdapter.js', async () => {
  const actual = await vi.importActual<typeof import('./providerAdapter.js')>('./providerAdapter.js')
  return {
    ...actual,
    isProviderConfigured: () => true,
    runProviderToolLoop: vi.fn(async () => ({
      response: 'Sure.',
      toolCalls: [],
      steps: [],
      needsConfirmation: false,
      providerModel: 'test-model',
      rounds: 1,
    })),
  }
})

describe('resolveAssistantReply live→local tool merge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fills set_mute when Live AI replies without tools', async () => {
    const { resolveAssistantReply } = await import('./assistantCore.js')
    const result = await resolveAssistantReply(
      'Mute',
      {
        view: 'live',
        currentChannelId: 'live_aether_one',
        favorites: [],
        recentIds: [],
        channels: DEMO_CHANNELS,
        epg: DEMO_EPG,
      },
      { modelConfigured: true, apiKey: 'sk-test' },
    )

    expect(result.aiMode).toBe('live')
    const mute = result.toolCalls.find((tool) => tool.tool === 'set_mute')
    expect(mute?.data?.muted).toBe(true)
  })

  it('fills set_reminder when Live AI omits the tool', async () => {
    const { resolveAssistantReply } = await import('./assistantCore.js')
    const result = await resolveAssistantReply(
      'Remind me when Match Center starts',
      {
        view: 'guide',
        currentChannelId: null,
        favorites: [],
        recentIds: [],
        channels: DEMO_CHANNELS,
        epg: DEMO_EPG,
      },
      { modelConfigured: true, apiKey: 'sk-test' },
    )

    expect(result.aiMode).toBe('live')
    const reminder = result.toolCalls.find((tool) => tool.tool === 'set_reminder')
    expect(reminder?.status).toBe('executed')
    expect(reminder?.data?.reminders?.length).toBeGreaterThan(0)
  })
})
