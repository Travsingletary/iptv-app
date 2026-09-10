/**
 * Pure helpers for lazy / paginated VOD browse (MegaOTT / Xtream categories).
 */
import type { Channel, VodCategory } from '../types/iptv.js'
import { normalizeCategory } from './categories.js'

export const VOD_PAGE_SIZE = 48

/** Slice a catalog page (1-based page index). */
export function pageSlice<T>(items: T[], page: number, pageSize = VOD_PAGE_SIZE): T[] {
  const p = Math.max(1, Math.floor(page) || 1)
  const size = Math.max(1, Math.floor(pageSize) || VOD_PAGE_SIZE)
  const start = (p - 1) * size
  return items.slice(start, start + size)
}

export function pageCount(total: number, pageSize = VOD_PAGE_SIZE): number {
  if (total <= 0) return 0
  return Math.ceil(total / Math.max(1, pageSize))
}

/** Merge incoming channels by id; prefer newer rows. */
export function mergeChannelsById(existing: Channel[], incoming: Channel[]): Channel[] {
  if (!incoming.length) return existing
  const map = new Map(existing.map((c) => [c.id, c]))
  for (const ch of incoming) map.set(ch.id, ch)
  return [...map.values()]
}

/** Drop channels that belong to a provider category id (movie/series). */
export function removeChannelsForCategory(
  channels: Channel[],
  categoryId: string,
  kind: 'movie' | 'series',
): Channel[] {
  return channels.filter(
    (c) => !(c.kind === kind && c.providerCategoryId === String(categoryId)),
  )
}

export function channelsInCategory(
  channels: Channel[],
  categoryId: string,
  kind?: 'movie' | 'series',
): Channel[] {
  return channels.filter((c) => {
    if (c.providerCategoryId !== String(categoryId)) return false
    if (kind && c.kind !== kind) return false
    return c.kind === 'movie' || c.kind === 'series'
  })
}

/** Rank VOD provider categories for chip display (Movies-ish first, then alpha). */
export function rankVodCategories(categories: VodCategory[]): VodCategory[] {
  const weight = (c: VodCategory) => {
    const bucket = c.normalized || normalizeCategory(c.name)
    let score = 0
    if (c.kind === 'movie') score += 100
    if (bucket === 'Movies') score += 40
    if (bucket === 'Kids') score += 20
    if (bucket === 'Documentary') score += 10
    if (bucket === 'Other') score -= 5
    return score
  }
  return [...categories].sort(
    (a, b) => weight(b) - weight(a) || a.name.localeCompare(b.name),
  )
}

export function demoVodCategoriesFromChannels(channels: Channel[]): VodCategory[] {
  const groups = new Map<string, VodCategory>()
  for (const ch of channels) {
    if (ch.kind !== 'movie' && ch.kind !== 'series') continue
    const key = `${ch.kind}:${ch.group || 'On demand'}`
    if (groups.has(key)) continue
    groups.set(key, {
      id: `demo_${ch.kind}_${(ch.group || 'ondemand').replace(/\W+/g, '_').toLowerCase()}`,
      name: ch.group || (ch.kind === 'movie' ? 'Movies' : 'Series'),
      kind: ch.kind,
      normalized: normalizeCategory(ch.group, ch.name),
    })
  }
  return rankVodCategories([...groups.values()])
}
