import { beforeEach, describe, expect, it } from 'vitest'
import {
  AI_BYOK_STORAGE_KEY,
  clearAiByokSettings,
  getProviderPreset,
  hasByokApiKey,
  loadAiByokSettings,
  maskApiKey,
  resolveByokEndpoint,
  saveAiByokSettings,
} from './aiByok'
import { getClientAiModeHint } from './aiMode'

describe('aiByok', () => {
  beforeEach(() => {
    globalThis.localStorage?.clear()
    clearAiByokSettings()
  })

  it('masks API keys without revealing the full secret', () => {
    expect(maskApiKey('')).toBe('')
    expect(maskApiKey('short')).toBe('••••••••')
    expect(maskApiKey('sk-abcdefghijklmnopqrstuvwxyz')).toMatch(/wxyz$/)
    expect(maskApiKey('sk-abcdefghijklmnopqrstuvwxyz')).not.toContain('sk-abcdef')
  })

  it('persists provider settings in localStorage', () => {
    saveAiByokSettings({
      provider: 'groq',
      apiKey: 'gsk_test_key_123456',
      model: 'llama-3.3-70b-versatile',
    })
    const loaded = loadAiByokSettings()
    expect(loaded.provider).toBe('groq')
    expect(loaded.apiKey).toBe('gsk_test_key_123456')
    expect(globalThis.localStorage.getItem(AI_BYOK_STORAGE_KEY)).toContain('groq')
  })

  it('resolves OpenRouter and proxy transport bases', () => {
    saveAiByokSettings({
      provider: 'openrouter',
      apiKey: 'or-key-xxxxxxxxxxxx',
    })
    const endpoint = resolveByokEndpoint()
    expect(endpoint?.transportBaseUrl).toBe('https://openrouter.ai/api/v1')
    expect(endpoint?.model).toBe(getProviderPreset('openrouter').defaultModel)
    expect(endpoint?.usingProxy).toBe(false)

    saveAiByokSettings({ proxyUrl: 'https://relay.example.com/v1/' })
    const proxied = resolveByokEndpoint()
    expect(proxied?.transportBaseUrl).toBe('https://relay.example.com/v1')
    expect(proxied?.usingProxy).toBe(true)
    expect(proxied?.anthropicMessages).toBe(false)
  })

  it('requires base URL or proxy for custom provider', () => {
    saveAiByokSettings({ provider: 'custom', apiKey: 'sk-custom', baseUrl: '' })
    expect(resolveByokEndpoint()).toBeNull()
    saveAiByokSettings({ baseUrl: 'https://llm.local/v1' })
    expect(resolveByokEndpoint()?.transportBaseUrl).toBe('https://llm.local/v1')
  })

  it('marks Anthropic preset for Messages API unless proxied', () => {
    saveAiByokSettings({
      provider: 'anthropic',
      apiKey: 'sk-ant-test-key-xxxx',
    })
    expect(resolveByokEndpoint()?.anthropicMessages).toBe(true)
    saveAiByokSettings({ proxyUrl: 'https://relay.example.com/v1' })
    expect(resolveByokEndpoint()?.anthropicMessages).toBe(false)
  })

  it('drives Live AI hint when a BYOK key is present', () => {
    expect(hasByokApiKey()).toBe(false)
    expect(getClientAiModeHint().mode).toBe('mock')
    saveAiByokSettings({ provider: 'openai', apiKey: 'sk-live-test-abcdef' })
    const hint = getClientAiModeHint()
    expect(hint.mode).toBe('live')
    expect(hint.source).toBe('byok')
    expect(hint.label).toMatch(/OpenAI/i)
  })
})
