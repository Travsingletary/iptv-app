import { describe, expect, it } from 'vitest'
import { isProviderConfigured } from './providerAdapter'

describe('providerAdapter', () => {
  it('requires an API key to be configured', () => {
    expect(isProviderConfigured({})).toBe(false)
    expect(isProviderConfigured({ provider: 'openai' })).toBe(false)
    expect(isProviderConfigured({ apiKey: 'sk-test' })).toBe(true)
  })
})
