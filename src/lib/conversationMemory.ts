export interface ConversationTurn {
  role: 'user' | 'assistant'
  text: string
  at: number
}

const STORAGE_KEY = 'aether_assistant_memory_v1'
const MAX_TURNS = 24

let sessionMemory: ConversationTurn[] = []

function canUseStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
}

export function loadConversationMemory(): ConversationTurn[] {
  if (sessionMemory.length) return sessionMemory.slice()
  if (!canUseStorage()) return []
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ConversationTurn[]
    if (!Array.isArray(parsed)) return []
    sessionMemory = parsed.slice(-MAX_TURNS)
    return sessionMemory.slice()
  } catch {
    return []
  }
}

export function saveConversationMemory(turns: ConversationTurn[]): void {
  sessionMemory = turns.slice(-MAX_TURNS)
  if (!canUseStorage()) return
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionMemory))
}

export function appendConversationTurn(
  role: ConversationTurn['role'],
  text: string,
  at = Date.now(),
): ConversationTurn[] {
  const next = [...loadConversationMemory(), { role, text, at }].slice(-MAX_TURNS)
  saveConversationMemory(next)
  return next
}

export function clearConversationMemory(): void {
  sessionMemory = []
  if (!canUseStorage()) return
  globalThis.localStorage.removeItem(STORAGE_KEY)
}

export function memoryAsHistory(
  turns: ConversationTurn[] = loadConversationMemory(),
  limit = 8,
): Array<{ role: 'user' | 'assistant'; text: string }> {
  return turns.slice(-limit).map((t) => ({ role: t.role, text: t.text }))
}
