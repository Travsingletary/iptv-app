import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export type ClientEventType =
  | 'play_start'
  | 'play_end'
  | 'channel_switch'
  | 'favorite_toggle'
  | 'search_query'

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
let memoryBuffer: ClientEvent[] = []

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function readBuffer() {
  if (!canUseStorage()) return memoryBuffer
  const raw = window.localStorage.getItem(BUFFER_KEY)
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw) as ClientEvent[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeBuffer(events: ClientEvent[]) {
  memoryBuffer = events
  if (!canUseStorage()) return
  window.localStorage.setItem(BUFFER_KEY, JSON.stringify(events.slice(-200)))
}

function createSupabaseClient(): SupabaseClient | null {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const supabase = createSupabaseClient()

async function trySend(events: ClientEvent[]) {
  if (!supabase || !events.length) return false
  const { error } = await supabase.from('client_events').insert(
    events.map((event) => ({
      event_type: event.type,
      created_at_ms: event.at,
      payload: event.payload,
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
    const sent = await trySend(current)
    if (sent) writeBuffer([])
  },
  peekBuffer() {
    return readBuffer()
  },
}

export async function trackEvent(
  type: ClientEventType,
  payload: ClientEvent['payload'],
) {
  await eventLogger.track({ type, payload, at: Date.now() })
}
