import { describe, expect, it } from 'vitest'
import { isProviderConfigured } from './providerAdapter'

describe('providerAdapter', () => {
  it('reports unconfigured without api key', () => {
    expect(isProviderConfigured({})).toBe(false)
    expect(isProviderConfigured({ provider: 'openai' })).toBe(true)
    expect(isProviderConfigured({ apiKey: 'sk-test' })).toBe(true)
  })
})
