import { describe, expect, it } from 'vitest'
import {
  appendConversationTurn,
  clearConversationMemory,
  loadConversationMemory,
  memoryAsHistory,
  saveConversationMemory,
} from './conversationMemory'

describe('conversationMemory', () => {
  it('persists turns per profile and exposes history', () => {
    clearConversationMemory('profile_a')
    clearConversationMemory('profile_b')
    appendConversationTurn('user', 'Mute', Date.now(), 'profile_a')
    appendConversationTurn('assistant', 'Audio muted.', Date.now(), 'profile_a')
    appendConversationTurn('user', 'Kids shows', Date.now(), 'profile_b')
    expect(loadConversationMemory('profile_a')).toHaveLength(2)
    expect(loadConversationMemory('profile_b')).toHaveLength(1)
    expect(memoryAsHistory(loadConversationMemory('profile_a'), 1)).toEqual([
      { role: 'assistant', text: 'Audio muted.' },
    ])
    saveConversationMemory([], 'profile_a')
    expect(loadConversationMemory('profile_a')).toHaveLength(0)
  })
})
