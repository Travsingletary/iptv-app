import { describe, expect, it } from 'vitest'
import {
  appendConversationTurn,
  clearConversationMemory,
  loadConversationMemory,
  memoryAsHistory,
  saveConversationMemory,
} from './conversationMemory'

describe('conversationMemory', () => {
  it('persists turns in session and exposes history', () => {
    clearConversationMemory()
    appendConversationTurn('user', 'Mute')
    appendConversationTurn('assistant', 'Audio muted.')
    const loaded = loadConversationMemory()
    expect(loaded).toHaveLength(2)
    expect(memoryAsHistory(loaded, 1)).toEqual([{ role: 'assistant', text: 'Audio muted.' }])
    saveConversationMemory([])
    expect(loadConversationMemory()).toHaveLength(0)
  })
})
