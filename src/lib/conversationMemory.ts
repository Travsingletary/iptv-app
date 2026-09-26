export interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
  at: number
}

import { profileMemoryKey } from './profiles.js'

const LEGACY_KEY = 'aether_assistant_memory_v1'
const MAX_TURNS = 24

const sessionByProfile = new Map<string, ConversationTurn[]>()

function canUseStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
}

export function loadConversationMemory(profileId = 'profile_household'): ConversationTurn[] {
  const cached = sessionByProfile.get(profileId)
  if (cached?.length) return cached.slice()
  if (!canUseStorage()) return []
  try {
    const key = profileMemoryKey(profileId)
    let raw = globalThis.localStorage.getItem(key)
    // Migrate legacy single-bucket memory into default household once.
    if (!raw && profileId === 'profile_household') {
      raw = globalThis.localStorage.getItem(LEGACY_KEY)
    }
    if (!raw) return []
    const parsed = JSON.parse(raw) as ConversationTurn[]
    if (!Array.isArray(parsed)) return []
    const turns = parsed.slice(-MAX_TURNS)
    sessionByProfile.set(profileId, turns)
    return turns.slice()
  } catch {
    return []
  }
}

export function saveConversationMemory(
  turns: ConversationTurn[],
  profileId = 'profile_household',
): void {
  const next = turns.slice(-MAX_TURNS)
  sessionByProfile.set(profileId, next)
  if (!canUseStorage()) return
  globalThis.localStorage.setItem(profileMemoryKey(profileId), JSON.stringify(next))
}

export function appendConversationTurn(
  role: ConversationTurn['role'],
  text: string,
  at = Date.now(),
  profileId = 'profile_household',
): ConversationTurn[] {
  const next = [...loadConversationMemory(profileId), { role, text, at }].slice(-MAX_TURNS)
  saveConversationMemory(next, profileId)
  return next
}

export function clearConversationMemory(profileId = 'profile_household'): void {
  sessionByProfile.delete(profileId)
  if (!canUseStorage()) return
  globalThis.localStorage.removeItem(profileMemoryKey(profileId))
}

export function memoryAsHistory(
  turns: ConversationTurn[] = loadConversationMemory(),
  limit = 8,
): Array<{ role: 'user' | 'assistant'; text: string }> {
  return turns.slice(-limit).map((t) => ({ role: t.role, text: t.text }))
}
