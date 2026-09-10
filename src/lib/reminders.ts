import type { Channel, EpgProgram, ProgramReminder } from '../types/iptv.js'

export type { ProgramReminder }

export interface ReminderDraft {
  programId: string
  programTitle: string
  channelId: string
  channelName: string
  fireAt: number
}

const STORAGE_KEY = 'aether_reminders_v1'

function canUseStorage() {
  return typeof globalThis !== 'undefined' && typeof globalThis.localStorage !== 'undefined'
}

export function loadReminders(): ProgramReminder[] {
  if (!canUseStorage()) return []
  try {
    const raw = globalThis.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ProgramReminder[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveReminders(reminders: ProgramReminder[]): void {
  if (!canUseStorage()) return
  globalThis.localStorage.setItem(STORAGE_KEY, JSON.stringify(reminders.slice(-80)))
}

export function createReminder(draft: ReminderDraft, now = Date.now()): ProgramReminder {
  return {
    id: `rem_${now.toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    programId: draft.programId,
    programTitle: draft.programTitle,
    channelId: draft.channelId,
    channelName: draft.channelName,
    fireAt: draft.fireAt,
    createdAt: now,
    fired: false,
    dismissed: false,
  }
}

/** Upcoming (not yet started) programs matching a free-text query. */
export function findUpcomingPrograms(
  query: string,
  channels: Channel[],
  epg: EpgProgram[],
  now = Date.now(),
  limit = 5,
): ReminderDraft[] {
  const normalized = query.toLowerCase().replace(/[^\w\s]/g, ' ').trim()
  const tokens = normalized.split(/\s+/).filter((t) => t.length > 2)
  if (!normalized && !tokens.length) return []

  const channelByKey = new Map<string, Channel>()
  for (const ch of channels) {
    channelByKey.set(ch.id.toLowerCase(), ch)
    if (ch.tvgId) channelByKey.set(ch.tvgId.toLowerCase(), ch)
    channelByKey.set(ch.name.toLowerCase(), ch)
  }

  const scored: Array<ReminderDraft & { score: number }> = []

  for (const program of epg) {
    if (program.start <= now) continue
    const channel =
      channelByKey.get(program.channelId.toLowerCase()) ||
      channels.find(
        (ch) => ch.tvgId === program.channelId || ch.id === program.channelId,
      )
    const hay = [
      program.title,
      program.description ?? '',
      program.category ?? '',
      channel?.name ?? '',
      channel?.group ?? '',
    ]
      .join(' ')
      .toLowerCase()

    const hit =
      (normalized.length > 2 && hay.includes(normalized)) ||
      tokens.some((token) => hay.includes(token))
    if (!hit) continue

    scored.push({
      programId: program.id,
      programTitle: program.title,
      channelId: channel?.id ?? program.channelId,
      channelName: channel?.name ?? program.channelId,
      fireAt: program.start,
      score: program.start,
    })
  }

  return scored
    .sort((a, b) => a.score - b.score)
    .slice(0, limit)
    .map(({ score: _score, ...draft }) => draft)
}

export function markDueReminders(
  reminders: ProgramReminder[],
  now = Date.now(),
): { next: ProgramReminder[]; newlyFired: ProgramReminder[] } {
  const newlyFired: ProgramReminder[] = []
  const next = reminders.map((reminder) => {
    if (reminder.dismissed || reminder.fired) return reminder
    if (reminder.fireAt <= now) {
      const fired = { ...reminder, fired: true }
      newlyFired.push(fired)
      return fired
    }
    return reminder
  })
  return { next, newlyFired }
}

export function activeReminders(reminders: ProgramReminder[]): ProgramReminder[] {
  return reminders
    .filter((r) => !r.dismissed)
    .sort((a, b) => a.fireAt - b.fireAt)
}

export function dismissReminder(
  reminders: ProgramReminder[],
  id: string,
): ProgramReminder[] {
  return reminders.map((r) => (r.id === id ? { ...r, dismissed: true } : r))
}
