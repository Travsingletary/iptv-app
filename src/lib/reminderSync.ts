/**
 * Optional Supabase sync for program reminders.
 * Always keeps a localStorage source of truth; remote is best-effort.
 * When Auth is signed in, rows are tagged with user_id for RLS.
 */
import type { ProgramReminder } from '../types/iptv.js'
import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient'
import { getAuthSnapshot } from './supabaseAuth'

export type ReminderSyncStatus = 'local_only' | 'idle' | 'syncing' | 'synced' | 'error'

let lastStatus: ReminderSyncStatus = 'local_only'
let lastError: string | null = null
let lastSyncedAt: number | null = null

export function isReminderSyncConfigured(): boolean {
  return isSupabaseConfigured()
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
  user_id?: string | null
  profile_id?: string | null
}

function toRow(reminder: ProgramReminder, userId: string | null, profileId?: string | null): ReminderRow {
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
    user_id: userId,
    profile_id: profileId ?? null,
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
  profileId?: string | null,
): Promise<boolean> {
  const sb = getSupabaseClient()
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
    const auth = await getAuthSnapshot()
    const { error } = await sb.from('program_reminders').upsert(
      reminders.map((r) => toRow(r, auth.userId, profileId)),
      { onConflict: 'id' },
    )
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
  const sb = getSupabaseClient()
  if (!sb) return null
  lastStatus = 'syncing'
  try {
    const auth = await getAuthSnapshot()
    let query = sb
      .from('program_reminders')
      .select('*')
      .eq('dismissed', false)
      .order('fire_at_ms', { ascending: true })
      .limit(80)
    if (auth.userId) {
      query = query.eq('user_id', auth.userId)
    }
    const { data, error } = await query
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
