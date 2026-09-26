/**
 * Debounced localStorage wrapper for Zustand persist.
 * Fire Stick freezes when MegaOTT (~7k channels) is JSON.stringified on every zap.
 */
import type { Channel } from '../types/iptv'
import { channelsForPersistenceTight } from './persistChannels'

export type AsyncStorage = {
  getItem: (name: string) => string | null | Promise<string | null>
  setItem: (name: string, value: string) => void | Promise<void>
  removeItem: (name: string) => void | Promise<void>
}

function writeWithQuotaFallback(name: string, value: string) {
  try {
    localStorage.setItem(name, value)
    return
  } catch {
    /* QuotaExceeded — compact logos out of the serialized snapshot */
  }
  try {
    const parsed = JSON.parse(value) as {
      state?: { channels?: Channel[] }
      version?: number
    }
    if (parsed.state?.channels) {
      parsed.state.channels = channelsForPersistenceTight(parsed.state.channels)
    }
    localStorage.setItem(name, JSON.stringify(parsed))
    return
  } catch {
    /* fall through */
  }
  try {
    const parsed = JSON.parse(value) as { state?: Record<string, unknown>; version?: number }
    if (parsed.state) parsed.state.channels = []
    localStorage.setItem(name, JSON.stringify(parsed))
  } catch {
    /* ignore */
  }
}

export function createDebouncedLocalStorage(delayMs = 1600): AsyncStorage {
  const timers = new Map<string, ReturnType<typeof setTimeout>>()
  const pending = new Map<string, string>()

  const flush = (name: string) => {
    timers.delete(name)
    const value = pending.get(name)
    pending.delete(name)
    if (value === undefined) return
    writeWithQuotaFallback(name, value)
  }

  return {
    getItem: (name) => {
      if (pending.has(name)) return pending.get(name)!
      return localStorage.getItem(name)
    },
    setItem: (name, value) => {
      pending.set(name, value)
      const existing = timers.get(name)
      if (existing) clearTimeout(existing)
      timers.set(
        name,
        setTimeout(() => flush(name), delayMs),
      )
    },
    removeItem: (name) => {
      const existing = timers.get(name)
      if (existing) clearTimeout(existing)
      timers.delete(name)
      pending.delete(name)
      localStorage.removeItem(name)
    },
  }
}
