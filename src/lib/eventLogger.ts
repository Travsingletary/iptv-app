import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseClient } from './supabaseClient'
import { getAuthSnapshot } from './supabaseAuth'

export type ClientEventType =
  | 'play_start'
  | 'play_end'
  | 'channel_switch'
  | 'favorite_toggle'
  | 'search_query'
  | 'playback_retry'

export interface ClientEvent {
  type: ClientEventType
  at: number
  payload: Record<string, string | number | boolean | null>
}

interface EventLogger {
  track: (event: ClientEvent) => Promise<void>
  flush: () => Promise<void>
  peekBuffer: () => ClientEvent[]
}

const BUFFER_KEY = 'aether_event_buffer'
/** In-memory is authoritative; localStorage is a debounced mirror. */
let memoryBuffer: ClientEvent[] = []
let hydrated = false
let writeTimer: ReturnType<typeof setTimeout> | null = null
/** Coalesce disk writes (Fire Stick) but stay under e2e post-action waits (~400ms). */
const PERSIST_DEBOUNCE_MS = 200

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function hydrateFromStorage() {
  if (hydrated || !canUseStorage()) return
  hydrated = true
  const raw = window.localStorage.getItem(BUFFER_KEY)
  if (!raw) return
  try {
    const parsed = JSON.parse(raw) as ClientEvent[]
    if (Array.isArray(parsed)) memoryBuffer = parsed
  } catch {
    /* keep empty memory */
  }
}

function readBuffer() {
  hydrateFromStorage()
  return memoryBuffer
}

function writeBuffer(events: ClientEvent[]) {
  hydrated = true
  memoryBuffer = events
  if (!canUseStorage()) return
  const payload = JSON.stringify(events.slice(-200))
  // Debounce disk writes — channel_switch spam was freezing Fire Stick WebView.
  if (writeTimer) clearTimeout(writeTimer)
  writeTimer = setTimeout(() => {
    writeTimer = null
    try {
      window.localStorage.setItem(BUFFER_KEY, payload)
    } catch {
      /* ignore quota */
    }
  }, PERSIST_DEBOUNCE_MS)
}

async function trySend(events: ClientEvent[], sb: SupabaseClient | null) {
  if (!sb || !events.length) return false
  const auth = await getAuthSnapshot()
  const { error } = await sb.from('client_events').insert(
    events.map((event) => ({
      event_type: event.type,
      created_at_ms: event.at,
      payload: event.payload,
      user_id: auth.userId,
    })),
  )
  return !error
}

export const eventLogger: EventLogger = {
  async track(event) {
    const next = [...readBuffer(), event].slice(-200)
    writeBuffer(next)
    await eventLogger.flush()
  },
  async flush() {
    const current = readBuffer()
    if (!current.length) return
    const sb = getSupabaseClient()
    const sent = await trySend(current, sb)
    if (sent) writeBuffer([])
  },
  peekBuffer() {
    return readBuffer()
  },
}

export async function trackEvent(type: ClientEventType, payload: ClientEvent['payload']) {
  await eventLogger.track({ type, payload, at: Date.now() })
}
