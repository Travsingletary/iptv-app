/**
 * Optional Supabase sync for program reminders.
 * Always keeps a localStorage source of truth; remote is best-effort.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { ProgramReminder } from '../types/iptv.js'

export type ReminderSyncStatus = 'local_only' | 'idle' | 'syncing' | 'synced' | 'error'

let client: SupabaseClient | null | undefined
let lastStatus: ReminderSyncStatus = 'local_only'
let lastError: string | null = null
let lastSyncedAt: number | null = null

function getClient(): SupabaseClient | null {
  if (client !== undefined) return client
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined
  if (!url || !key) {
    client = null
    lastStatus = 'local_only'
    return null
  }
  client = createClient(url, key)
  lastStatus = 'idle'
  return client
}

export function isReminderSyncConfigured(): boolean {
  return Boolean(getClient())
}

export function getReminderSyncState(): {
  status: ReminderSyncStatus
  error: string | null
  syncedAt: number | null
  configured: boolean
} {
  const configured = isReminderSyncConfigured()
  return {
    status: configured ? lastStatus : 'local_only',
    error: lastError,
    syncedAt: lastSyncedAt,
    configured,
  }
}

interface ReminderRow {
  id: string
  program_id: string
  program_title: string
  channel_id: string
  channel_name: string
  fire_at_ms: number
  created_at_ms: number
  fired: boolean
  dismissed: boolean
}

function toRow(reminder: ProgramReminder): ReminderRow {
  return {
    id: reminder.id,
    program_id: reminder.programId,
    program_title: reminder.programTitle,
    channel_id: reminder.channelId,
    channel_name: reminder.channelName,
    fire_at_ms: reminder.fireAt,
    created_at_ms: reminder.createdAt,
    fired: reminder.fired,
    dismissed: reminder.dismissed,
  }
}

function fromRow(row: ReminderRow): ProgramReminder {
  return {
    id: row.id,
    programId: row.program_id,
    programTitle: row.program_title,
    channelId: row.channel_id,
    channelName: row.channel_name,
    fireAt: row.fire_at_ms,
    createdAt: row.created_at_ms,
    fired: row.fired,
    dismissed: row.dismissed,
  }
}

/** Best-effort upsert; never throws to callers. */
export async function syncRemindersToSupabase(
  reminders: ProgramReminder[],
): Promise<boolean> {
  const sb = getClient()
  if (!sb) {
    lastStatus = 'local_only'
    return false
  }
  if (!reminders.length) {
    lastStatus = 'idle'
    return false
  }
  lastStatus = 'syncing'
  lastError = null
  try {
    const { error } = await sb.from('program_reminders').upsert(reminders.map(toRow), {
      onConflict: 'id',
    })
    if (error) {
      lastStatus = 'error'
      lastError = error.message
      return false
    }
    lastStatus = 'synced'
    lastSyncedAt = Date.now()
    return true
  } catch (err) {
    lastStatus = 'error'
    lastError = err instanceof Error ? err.message : 'sync failed'
    return false
  }
}

export async function fetchRemindersFromSupabase(): Promise<ProgramReminder[] | null> {
  const sb = getClient()
  if (!sb) return null
  lastStatus = 'syncing'
  try {
    const { data, error } = await sb
      .from('program_reminders')
      .select('*')
      .eq('dismissed', false)
      .order('fire_at_ms', { ascending: true })
      .limit(80)
    if (error || !data) {
      lastStatus = 'error'
      lastError = error?.message ?? 'fetch failed'
      return null
    }
    lastStatus = 'synced'
    lastSyncedAt = Date.now()
    return (data as ReminderRow[]).map(fromRow)
  } catch (err) {
    lastStatus = 'error'
    lastError = err instanceof Error ? err.message : 'fetch failed'
    return null
  }
}
