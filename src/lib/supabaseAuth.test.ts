import { describe, expect, it } from 'vitest'
import { getAuthMode } from './supabaseAuth'
import { __resetSupabaseClientForTests, isSupabaseConfigured } from './supabaseClient'
import { getClientAiModeHint } from './aiMode'

describe('supabase auth helpers', () => {
  it('reports disabled when env credentials are absent', () => {
    __resetSupabaseClientForTests()
    expect(isSupabaseConfigured()).toBe(false)
    expect(getAuthMode(null)).toBe('disabled')
  })
})

describe('aiMode', () => {
  it('defaults to mock without client key', () => {
    const status = getClientAiModeHint()
    expect(status.mode).toBe('mock')
    expect(status.label).toMatch(/Mock/i)
  })
})
