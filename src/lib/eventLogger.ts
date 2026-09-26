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

// #region agent log
function dbg(hypothesisId: string, location: string, message: string, data: Record<string, unknown>) {
  const payload = {
    sessionId: 'f65a',
    runId: 'post-fix',
    hypothesisId,
    location,
    message,
    data,
    timestamp: Date.now(),
  }
  try {
    const w = window as unknown as { __AGENT_DEBUG_LOGS__?: unknown[] }
    w.__AGENT_DEBUG_LOGS__ = w.__AGENT_DEBUG_LOGS__ || []
    w.__AGENT_DEBUG_LOGS__.push(payload)
  } catch {
    /* ignore */
  }
  fetch('http://127.0.0.1:7242/ingest/f65a', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f65a' },
    body: JSON.stringify(payload),
  }).catch(() => {})
}
// #endregion

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
  // #region agent log
  dbg('A', 'eventLogger.ts:readBuffer', 'memory authoritative', {
    memoryLen: memoryBuffer.length,
    memoryTypes: memoryBuffer.map((e) => e.type),
    pendingWrite: !!writeTimer,
    hydrated,
  })
  // #endregion
  return memoryBuffer
}

function writeBuffer(events: ClientEvent[]) {
  hydrated = true
  memoryBuffer = events
  if (!canUseStorage()) return
  const payload = JSON.stringify(events.slice(-200))
  // Debounce disk writes — channel_switch spam was freezing Fire Stick WebView.
  if (writeTimer) clearTimeout(writeTimer)
  // #region agent log
  dbg('A', 'eventLogger.ts:writeBuffer', 'schedule debounce write', {
    types: events.map((e) => e.type),
    len: events.length,
    debounceMs: PERSIST_DEBOUNCE_MS,
  })
  // #endregion
  writeTimer = setTimeout(() => {
    writeTimer = null
    try {
      window.localStorage.setItem(BUFFER_KEY, payload)
      // #region agent log
      dbg('E', 'eventLogger.ts:writeBuffer:commit', 'LS committed', {
        types: (JSON.parse(payload) as ClientEvent[]).map((e) => e.type),
        len: (JSON.parse(payload) as ClientEvent[]).length,
      })
      // #endregion
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
    const before = readBuffer()
    const next = [...before, event].slice(-200)
    // #region agent log
    dbg('A', 'eventLogger.ts:track', 'track append', {
      newType: event.type,
      beforeTypes: before.map((e) => e.type),
      nextTypes: next.map((e) => e.type),
      pendingWrite: !!writeTimer,
    })
    // #endregion
    writeBuffer(next)
    await eventLogger.flush()
  },
  async flush() {
    const current = readBuffer()
    if (!current.length) return
    const sb = getSupabaseClient()
    // #region agent log
    dbg('B', 'eventLogger.ts:flush', 'flush attempt', {
      types: current.map((e) => e.type),
      hasSb: !!sb,
    })
    // #endregion
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
